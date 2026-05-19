/**
 * Vercel Cron — 주간 ETL 실행 엔드포인트
 *
 * 스케줄: 매주 일요일 21:00 UTC (한국 시간 월요일 06:00 KST)
 * 인증:   Authorization: Bearer {CRON_SECRET}
 *
 * 주간 작업:
 *  - 지자체 복지 포털 크롤링 큐 등록 (17개 광역시도)
 *  - KOSIS 고령자 통계 수집
 *
 * GET /api/cron/etl-weekly
 */

import { NextRequest, NextResponse } from 'next/server';
import { notifyBatchResult } from '@/etl/review-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** 주간 크롤링 대상 지자체 복지 포털 */
const LOCAL_GOV_TARGETS = [
  { sido: '서울특별시', portalUrl: 'https://welfare.seoul.go.kr' },
  { sido: '부산광역시', portalUrl: 'https://www.busan.go.kr/welfare' },
  { sido: '대구광역시', portalUrl: 'https://www.daegu.go.kr/welfare' },
  { sido: '인천광역시', portalUrl: 'https://www.incheon.go.kr/welfare' },
  { sido: '광주광역시', portalUrl: 'https://www.gwangju.go.kr/welfare' },
  { sido: '대전광역시', portalUrl: 'https://www.daejeon.go.kr/welfare' },
  { sido: '울산광역시', portalUrl: 'https://www.ulsan.go.kr/welfare' },
  { sido: '세종특별자치시', portalUrl: 'https://www.sejong.go.kr/welfare' },
  { sido: '경기도', portalUrl: 'https://www.gg.go.kr/welfare' },
  { sido: '강원특별자치도', portalUrl: 'https://www.gwd.go.kr/welfare' },
  { sido: '충청북도', portalUrl: 'https://www.chungbuk.go.kr/welfare' },
  { sido: '충청남도', portalUrl: 'https://www.chungnam.go.kr/welfare' },
  { sido: '전라북도', portalUrl: 'https://www.jeonbuk.go.kr/welfare' },
  { sido: '전라남도', portalUrl: 'https://www.jeonnam.go.kr/welfare' },
  { sido: '경상북도', portalUrl: 'https://www.gb.go.kr/welfare' },
  { sido: '경상남도', portalUrl: 'https://www.gyeongnam.go.kr/welfare' },
  { sido: '제주특별자치도', portalUrl: 'https://www.jeju.go.kr/welfare' },
] as const;

export interface CrawlQueueEntry {
  sido: string;
  portalUrl: string;
  enqueuedAt: string;
  status: 'queued';
}

/**
 * 지자체 크롤링 큐에 항목을 등록한다.
 * 실제 크롤링은 별도 워커(Worker Queue)에서 비동기로 처리된다.
 * 현재는 큐 등록 로그만 기록하고 향후 DB/Queue 서비스로 확장한다.
 */
async function enqueueLocalGovCrawl(
  target: (typeof LOCAL_GOV_TARGETS)[number]
): Promise<CrawlQueueEntry> {
  // TODO: 실제 큐(Upstash QStash, Vercel KV 등) 연동 시 여기서 등록
  const entry: CrawlQueueEntry = {
    sido: target.sido,
    portalUrl: target.portalUrl,
    enqueuedAt: new Date().toISOString(),
    status: 'queued',
  };

  console.log(
    `[WeeklyETL] 크롤링 큐 등록: ${entry.sido} → ${entry.portalUrl} (${entry.enqueuedAt})`
  );

  return entry;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authorization: Bearer {CRON_SECRET} 검증
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = new Date().toISOString();
  const log: string[] = [];
  const queued: CrawlQueueEntry[] = [];
  const errors: string[] = [];

  log.push(`주간 ETL 시작: 지자체 ${LOCAL_GOV_TARGETS.length}개 크롤링 큐 등록`);

  // ── 지자체 크롤링 큐 등록 ──────────────────────────────────────────────
  for (const target of LOCAL_GOV_TARGETS) {
    try {
      const entry = await enqueueLocalGovCrawl(target);
      queued.push(entry);
      log.push(`  큐 등록 완료: ${target.sido}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[local_gov/${target.sido}] ${msg}`);
      log.push(`  큐 등록 오류: ${target.sido} — ${msg}`);
    }
  }

  log.push(`주간 ETL 완료: 등록 ${queued.length}건, 오류 ${errors.length}건`);

  // ── Slack 알림 발송 ───────────────────────────────────────────────────
  await notifyBatchResult({
    source: '지자체 복지포털 (weekly)',
    total: LOCAL_GOV_TARGETS.length,
    matched: queued.length,
    enqueued: queued.length,
    errors,
  });

  const ok = errors.length === 0;

  return NextResponse.json(
    {
      ok,
      startedAt,
      finishedAt: new Date().toISOString(),
      queued: queued.length,
      targets: LOCAL_GOV_TARGETS.length,
      errors,
      log,
    },
    { status: ok ? 200 : 207 }
  );
}
