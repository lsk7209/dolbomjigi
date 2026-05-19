/**
 * IndexNow API 핑 모듈
 * Naver와 Bing에 새 URL을 동시에 제출하여 빠른 색인을 요청한다.
 *
 * 참고:
 * - https://www.indexnow.org/documentation
 * - https://searchadvisor.naver.com/guide/seo-basic-indexnow
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '';
const HOST = 'dolbomjigi.com';
const SITE_URL = `https://${HOST}`;

/** IndexNow 제출 엔드포인트 */
const INDEXNOW_ENDPOINTS = [
  'https://searchadvisor.naver.com/indexnow',  // Naver
  'https://www.bing.com/indexnow',              // Bing
  // 'https://api.indexnow.org/indexnow',       // IndexNow 표준 API (옵션)
] as const;

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

interface IndexNowResult {
  endpoint: string;
  success: boolean;
  status?: number;
  error?: string;
}

// ─────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────

/**
 * IndexNow API를 통해 Naver + Bing에 URL 목록을 동시 제출한다.
 *
 * @param urls - 색인 요청할 절대 URL 목록 (예: ['https://dolbomjigi.com/robot/hyodol'])
 *
 * @example
 * await pingIndexNow(['https://dolbomjigi.com/robot/hyodol'])
 */
export async function pingIndexNow(urls: string[]): Promise<IndexNowResult[]> {
  if (!INDEXNOW_KEY) {
    console.warn('[IndexNow] INDEXNOW_KEY 환경변수가 설정되지 않았습니다. 제출을 건너뜁니다.');
    return [];
  }

  if (urls.length === 0) {
    console.warn('[IndexNow] 제출할 URL이 없습니다.');
    return [];
  }

  // URL 유효성 검사 (절대 URL만 허용)
  const validUrls = urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === HOST;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    console.warn('[IndexNow] 유효한 URL이 없습니다. (호스트는 dolbomjigi.com이어야 합니다)');
    return [];
  }

  const payload: IndexNowPayload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: validUrls,
  };

  // Naver + Bing 동시 제출
  const results = await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map(async (endpoint): Promise<IndexNowResult> => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 202) {
          console.log(`[IndexNow] ${endpoint}: 제출 성공 (${res.status}) - ${validUrls.length}개 URL`);
          return { endpoint, success: true, status: res.status };
        }

        const body = await res.text().catch(() => '');
        console.error(`[IndexNow] ${endpoint}: 제출 실패 (${res.status}) - ${body}`);
        return { endpoint, success: false, status: res.status, error: body };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[IndexNow] ${endpoint}: 네트워크 오류 - ${msg}`);
        return { endpoint, success: false, error: msg };
      }
    })
  );

  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { endpoint: 'unknown', success: false, error: String(r.reason) }
  );
}

/**
 * 단일 URL을 색인 요청한다.
 *
 * @param url - 색인 요청할 절대 URL
 */
export async function pingIndexNowSingle(url: string): Promise<IndexNowResult[]> {
  return pingIndexNow([url]);
}

/**
 * 새 로봇 페이지, 지원사업 페이지 등 특정 콘텐츠 유형에 대한 IndexNow 핑 헬퍼
 */
export const IndexNowHelpers = {
  /** 로봇 상세 페이지 */
  robot: (slug: string) => pingIndexNowSingle(`${SITE_URL}/robot/${slug}`),

  /** 비교 페이지 */
  compare: (slug: string) => pingIndexNowSingle(`${SITE_URL}/compare/${slug}`),

  /** 가이드 페이지 */
  guide: (slug: string) => pingIndexNowSingle(`${SITE_URL}/guide/${slug}`),

  /** 지원사업 정보 페이지 */
  info: (slug: string) => pingIndexNowSingle(`${SITE_URL}/info/${slug}`),

  /** 지역별 지원사업 페이지 */
  supportRegion: (sidoSlug: string) =>
    pingIndexNowSingle(`${SITE_URL}/support/region/${sidoSlug}`),
} as const;
