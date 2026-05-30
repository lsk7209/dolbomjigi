/**
 * 일일 ETL 실행 스크립트
 *
 * 실행 방법:
 *   pnpm tsx src/etl/run-daily.ts
 *
 * 환경변수:
 *   BIZINFO_API_KEY  - bizinfo.go.kr API 인증키
 *   TURSO_DATABASE_URL
 *   TURSO_AUTH_TOKEN
 *   SLACK_WEBHOOK_URL (선택)
 */

import { fetchBizinfo, upsertBizinfoItems, TARGET_KEYWORDS } from './sources/bizinfo';
import { fetchMohwRss, saveMohwRssItems } from './sources/mohw-rss';
import { notifyBatchResult } from './review-queue';

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

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

/** 수집 대상 사업 분야 (bizinfo hashtags 파라미터) */
const FIELDS = [
  '복지',
  '노인',
  '장애인',
  '로봇',
  '돌봄',
  '재활',
  '의료',
  '지역사회',
] as const;

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

function log(msg: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level];
  const ts = new Date().toISOString();
  console.log(`${ts} ${prefix} ${msg}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────
// Step 1: bizinfo 수집
// ─────────────────────────────────────────

async function runBizinfoEtl(apiKey: string): Promise<{
  total: number;
  matched: number;
  enqueued: number;
  errors: string[];
}> {
  log('=== bizinfo ETL 시작 ===');

  const errors: string[] = [];
  let totalFetched = 0;
  let totalMatched = 0;
  let totalEnqueued = 0;

  // 17개 광역시도 × 순차 수집 (API rate limit 고려)
  for (const region of REGIONS) {
    try {
      log(`  지역 수집 중: ${region}`);
      const items = await fetchBizinfo(apiKey, region);
      totalFetched += items.length;
      totalMatched += items.length;

      if (items.length > 0) {
        await upsertBizinfoItems(items);
        totalEnqueued += items.length;
        log(`  ${region}: ${items.length}건 적재 완료`);
      }

      // API rate limit 방지: 지역 간 0.5초 대기
      await sleep(500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ${region} 수집 오류: ${msg}`, 'error');
      errors.push(`[bizinfo/${region}] ${msg}`);
    }
  }

  log(`=== bizinfo ETL 완료: 전체 ${totalFetched}건, 매칭 ${totalMatched}건, 적재 ${totalEnqueued}건 ===`);

  return { total: totalFetched, matched: totalMatched, enqueued: totalEnqueued, errors };
}

// ─────────────────────────────────────────
// Step 2: 보건복지부 RSS 수집
// ─────────────────────────────────────────

async function runMohwRssEtl(): Promise<{
  total: number;
  matched: number;
  enqueued: number;
  errors: string[];
}> {
  log('=== 보건복지부 RSS ETL 시작 ===');
  const errors: string[] = [];

  try {
    const items = await fetchMohwRss();
    log(`보건복지부 RSS: ${items.length}건 매칭됨`);

    let enqueued = 0;
    if (items.length > 0) {
      enqueued = await saveMohwRssItems(items);
      log(`보건복지부 RSS: ${enqueued}건 신규 저장`);
      for (const item of items) {
        log(`  - [${item.pubDate ?? 'N/A'}] ${item.title}`);
        log(`    URL: ${item.link}`);
        log(`    키워드: ${item.matched_keywords.join(', ')}`);
      }
    }

    log('=== 보건복지부 RSS ETL 완료 ===');
    return { total: items.length, matched: items.length, enqueued, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`보건복지부 RSS 오류: ${msg}`, 'error');
    errors.push(`[mohw_rss] ${msg}`);
    return { total: 0, matched: 0, enqueued: 0, errors };
  }
}

// ─────────────────────────────────────────
// Step 3: Slack 알림
// ─────────────────────────────────────────

async function runNotifications(
  bizinfoResult: { total: number; matched: number; enqueued: number; errors: string[] },
  mohwResult: { total: number; matched: number; enqueued: number; errors: string[] }
): Promise<void> {
  log('=== 알림 발송 중 ===');

  await Promise.allSettled([
    notifyBatchResult({
      source: 'bizinfo.go.kr',
      ...bizinfoResult,
    }),
    notifyBatchResult({
      source: '보건복지부 RSS',
      ...mohwResult,
    }),
  ]);
}

// ─────────────────────────────────────────
// 메인 진입점
// ─────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  log('==============================');
  log('돌봄지기 일일 ETL 시작');
  log(`대상 키워드: ${TARGET_KEYWORDS.length}개`);
  log(`대상 지역: ${REGIONS.length}개 광역시도`);
  log('==============================');

  const apiKey = process.env.BIZINFO_API_KEY;
  if (!apiKey) {
    log('BIZINFO_API_KEY 환경변수가 설정되지 않았습니다. bizinfo 수집을 건너뜁니다.', 'warn');
  }

  // Step 1: bizinfo 수집
  const bizinfoResult = apiKey
    ? await runBizinfoEtl(apiKey)
    : { total: 0, matched: 0, enqueued: 0, errors: ['BIZINFO_API_KEY 미설정'] };

  // Step 2: 보건복지부 RSS 수집
  const mohwResult = await runMohwRssEtl();

  // Step 3: 알림 발송
  await runNotifications(bizinfoResult, mohwResult);

  // 완료 리포트
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('==============================');
  log('돌봄지기 일일 ETL 완료');
  log(`소요 시간: ${elapsed}초`);
  log(`bizinfo 적재: ${bizinfoResult.enqueued}건`);
  log(`보건복지부 RSS 매칭: ${mohwResult.matched}건`);
  const totalErrors = bizinfoResult.errors.length + mohwResult.errors.length;
  if (totalErrors > 0) {
    log(`오류 ${totalErrors}건 발생`, 'warn');
    bizinfoResult.errors.forEach((e) => log(`  - ${e}`, 'error'));
    mohwResult.errors.forEach((e) => log(`  - ${e}`, 'error'));
    process.exit(1);
  }
  log('==============================');
}

main().catch((err) => {
  console.error('ETL 실행 중 치명적 오류:', err);
  process.exit(1);
});
