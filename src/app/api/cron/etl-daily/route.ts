/**
 * Vercel Cron — 일일 ETL 실행 엔드포인트
 *
 * 스케줄: 매일 18:00 UTC (한국 시간 03:00 KST)
 * 인증:   Authorization: Bearer {CRON_SECRET}
 *
 * GET /api/cron/etl-daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchBizinfo, upsertBizinfoItems, TARGET_KEYWORDS } from '@/etl/sources/bizinfo';
import { fetchMohwRss } from '@/etl/sources/mohw-rss';
import { notifyBatchResult } from '@/etl/review-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** 수집 대상 17개 광역시도 */
const REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  // ── Step 1: bizinfo 수집 ──────────────────────────────────────────────────
  const apiKey = process.env.BIZINFO_API_KEY;
  let bizinfoResult = { total: 0, matched: 0, enqueued: 0, errors: [] as string[] };

  if (!apiKey) {
    log.push('BIZINFO_API_KEY 미설정: bizinfo 수집 건너뜀');
    bizinfoResult.errors.push('BIZINFO_API_KEY 미설정');
  } else {
    log.push(`bizinfo ETL 시작: 키워드 ${TARGET_KEYWORDS.length}개, 지역 ${REGIONS.length}개`);

    for (const region of REGIONS) {
      try {
        const items = await fetchBizinfo(apiKey, region);
        bizinfoResult.total += items.length;
        bizinfoResult.matched += items.length;

        if (items.length > 0) {
          await upsertBizinfoItems(items);
          bizinfoResult.enqueued += items.length;
          log.push(`  ${region}: ${items.length}건 적재`);
        }

        await sleep(300);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        bizinfoResult.errors.push(`[bizinfo/${region}] ${msg}`);
        log.push(`  ${region} 오류: ${msg}`);
      }
    }

    log.push(
      `bizinfo 완료: 전체 ${bizinfoResult.total}건, 적재 ${bizinfoResult.enqueued}건`
    );
  }

  // ── Step 2: 보건복지부 RSS 수집 ──────────────────────────────────────────
  let mohwResult = { total: 0, matched: 0, enqueued: 0, errors: [] as string[] };

  try {
    log.push('보건복지부 RSS ETL 시작');
    const items = await fetchMohwRss();
    mohwResult.total = items.length;
    mohwResult.matched = items.length;

    for (const item of items) {
      log.push(`  RSS: [${item.pubDate ?? 'N/A'}] ${item.title}`);
    }

    log.push(`보건복지부 RSS 완료: ${items.length}건 매칭`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    mohwResult.errors.push(`[mohw_rss] ${msg}`);
    log.push(`보건복지부 RSS 오류: ${msg}`);
  }

  // ── Step 3: Slack 알림 발송 ───────────────────────────────────────────────
  await Promise.allSettled([
    notifyBatchResult({ source: 'bizinfo.go.kr (daily)', ...bizinfoResult }),
    notifyBatchResult({ source: '보건복지부 RSS (daily)', ...mohwResult }),
  ]);

  const totalErrors = bizinfoResult.errors.length + mohwResult.errors.length;
  const ok = totalErrors === 0;

  return NextResponse.json(
    {
      ok,
      startedAt,
      finishedAt: new Date().toISOString(),
      bizinfo: bizinfoResult,
      mohwRss: mohwResult,
      log,
    },
    { status: ok ? 200 : 207 }
  );
}
