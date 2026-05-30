/**
 * Vercel Cron — 주간 ETL 실행 엔드포인트
 *
 * 스케줄: 매주 일요일 21:00 UTC (한국 시간 월요일 06:00 KST)
 * 인증:   Authorization: Bearer {CRON_SECRET}
 *
 * 주간 작업:
 *  - bizinfo 전국 검색 (지역 필터 없이 10페이지) — 일일 지역별 검색 보완
 *  - 일일 ETL에서 지역 태그 없이 등록된 전국 공고를 포착
 *
 * GET /api/cron/etl-weekly
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchBizinfo, upsertBizinfoItems, TARGET_KEYWORDS } from '@/etl/sources/bizinfo';
import { notifyBatchResult } from '@/etl/review-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
  const result = { total: 0, matched: 0, enqueued: 0, errors: [] as string[] };

  const apiKey = process.env.BIZINFO_API_KEY;

  if (!apiKey) {
    result.errors.push('BIZINFO_API_KEY 미설정');
    log.push('BIZINFO_API_KEY 미설정: 수집 건너뜀');
  } else {
    log.push(`주간 ETL 시작: 전국 검색 10페이지, 키워드 ${TARGET_KEYWORDS.length}개`);

    // 지역 필터 없이 전국 검색 — 일일 ETL(지역별 5페이지)에서 누락된 항목 보완
    // maxPages=10: 페이지당 100건 × 10 = 최대 1,000건
    try {
      const items = await fetchBizinfo(apiKey, undefined, 10);
      result.total = items.length;
      result.matched = items.length;

      if (items.length > 0) {
        await upsertBizinfoItems(items);
        result.enqueued = items.length;
        log.push(`전국 검색 완료: ${items.length}건 적재`);
      } else {
        log.push('전국 검색 완료: 매칭된 항목 없음');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[bizinfo/national] ${msg}`);
      log.push(`전국 검색 오류: ${msg}`);
    }
  }

  log.push(`주간 ETL 완료: 적재 ${result.enqueued}건, 오류 ${result.errors.length}건`);

  await notifyBatchResult({
    source: 'bizinfo.go.kr 전국 (weekly)',
    ...result,
  });

  const ok = result.errors.length === 0;

  return NextResponse.json(
    {
      ok,
      startedAt,
      finishedAt: new Date().toISOString(),
      ...result,
      log,
    },
    { status: ok ? 200 : 207 }
  );
}
