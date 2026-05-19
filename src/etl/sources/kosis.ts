/**
 * KOSIS API (통계청 오픈API) 수집 모듈
 * 고령자 통계 수집 인터페이스 및 구조 정의.
 * 실제 API 키는 환경변수 KOSIS_API_KEY로 주입한다.
 *
 * 참고: https://kosis.kr/openapi/index/index.jsp
 */

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

const KOSIS_API_BASE = 'https://kosis.kr/openapi/Param/statisticsParameterData.do';

/**
 * 통계청 고령자 관련 주요 통계표 코드 (예시)
 * - orgId: 통계 작성 기관 코드
 * - tblId: 통계표 ID
 */
export const KOSIS_TABLE_CODES = {
  /** 고령자 인구 현황 (주민등록인구) */
  ELDERLY_POPULATION: { orgId: '101', tblId: 'DT_1B040M5' },
  /** 독거노인 현황 */
  SINGLE_ELDERLY: { orgId: '101', tblId: 'DT_1PL1502' },
  /** 노인 복지시설 현황 */
  WELFARE_FACILITIES: { orgId: '117', tblId: 'DT_11702_N003' },
} as const;

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

export interface KosisItem {
  /** 지역 코드 (예: '11' = 서울특별시) */
  regionCode: string;
  /** 지역명 */
  regionName: string;
  /** 통계 항목 코드 */
  itemCode: string;
  /** 통계 항목명 */
  itemName: string;
  /** 기준 연도 */
  year: string;
  /** 기준 월 (없으면 null) */
  month: string | null;
  /** 통계 수치 */
  value: number | null;
  /** 단위 */
  unit: string | null;
}

export interface KosisApiResponse {
  err?: string;
  errMsg?: string;
  DATA?: KosisRawRow[];
}

export interface KosisRawRow {
  TBL_ID?: string;        // 통계표 ID
  TBL_NM?: string;        // 통계표명
  ITM_ID?: string;        // 항목 코드
  ITM_NM?: string;        // 항목명
  PRD_DE?: string;        // 수록 기간 (YYYYMM 또는 YYYY)
  DT?: string;            // 수치
  UNIT_NM?: string;       // 단위명
  C1?: string;            // 분류1 코드
  C1_NM?: string;         // 분류1 명
  [key: string]: unknown;
}

export interface KosisFetchOptions {
  /** 통계 작성 기관 코드 */
  orgId: string;
  /** 통계표 ID */
  tblId: string;
  /** 기준 기간 시작 (YYYY 또는 YYYYMM) */
  startPrdDe?: string;
  /** 기준 기간 종료 */
  endPrdDe?: string;
}

// ─────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────

function normalizeKosisRow(row: KosisRawRow): KosisItem {
  const prd = row.PRD_DE ?? '';
  const year = prd.length >= 4 ? prd.slice(0, 4) : prd;
  const month = prd.length === 6 ? prd.slice(4, 6) : null;

  const rawValue = row.DT?.replace(/,/g, '');
  const value = rawValue && rawValue !== '-' ? parseFloat(rawValue) : null;

  return {
    regionCode: row.C1 ?? '',
    regionName: row.C1_NM ?? '',
    itemCode: row.ITM_ID ?? '',
    itemName: row.ITM_NM ?? '',
    year,
    month,
    value: isNaN(value as number) ? null : value,
    unit: row.UNIT_NM ?? null,
  };
}

// ─────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────

/**
 * KOSIS API에서 특정 지역의 고령자 인구 통계를 수집한다.
 *
 * @param regionCode - 지역 코드 (예: '11' = 서울, '21' = 부산, '' = 전국)
 * @param apiKey - KOSIS API 인증키 (환경변수 KOSIS_API_KEY)
 * @returns KosisItem 목록
 *
 * @example
 * const items = await fetchElderlyPopulation('11', process.env.KOSIS_API_KEY ?? '')
 */
export async function fetchElderlyPopulation(
  regionCode: string,
  apiKey: string
): Promise<KosisItem[]> {
  if (!apiKey) {
    console.warn('[KOSIS] API 키가 설정되지 않았습니다. KOSIS_API_KEY 환경변수를 확인하세요.');
    return [];
  }

  const { orgId, tblId } = KOSIS_TABLE_CODES.ELDERLY_POPULATION;
  const currentYear = new Date().getFullYear();

  const params = new URLSearchParams({
    method: 'getList',
    apiKey,
    orgId,
    tblId,
    itmId: 'T1',        // 총인구
    objL1: regionCode || 'ALL',
    format: 'json',
    jsonVD: 'Y',
    prdSe: 'Y',         // 연간
    startPrdDe: String(currentYear - 3),
    endPrdDe: String(currentYear),
  });

  const url = `${KOSIS_API_BASE}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`KOSIS API 오류: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as KosisApiResponse | KosisRawRow[];

  // KOSIS API는 오류 시 배열 대신 오브젝트로 반환하는 경우가 있음
  if (!Array.isArray(json)) {
    const errResp = json as KosisApiResponse;
    if (errResp.err) {
      throw new Error(`KOSIS API 오류 코드 ${errResp.err}: ${errResp.errMsg ?? ''}`);
    }
    const data = errResp.DATA ?? [];
    return data.map(normalizeKosisRow);
  }

  return json.map(normalizeKosisRow);
}

/**
 * KOSIS API에서 독거노인 현황 통계를 수집한다.
 *
 * @param regionCode - 지역 코드
 * @param apiKey - KOSIS API 인증키
 * @returns KosisItem 목록
 */
export async function fetchSingleElderlyStats(
  regionCode: string,
  apiKey: string
): Promise<KosisItem[]> {
  if (!apiKey) {
    console.warn('[KOSIS] API 키가 설정되지 않았습니다.');
    return [];
  }

  const { orgId, tblId } = KOSIS_TABLE_CODES.SINGLE_ELDERLY;
  const currentYear = new Date().getFullYear();

  const params = new URLSearchParams({
    method: 'getList',
    apiKey,
    orgId,
    tblId,
    itmId: 'ALL',
    objL1: regionCode || 'ALL',
    format: 'json',
    jsonVD: 'Y',
    prdSe: 'Y',
    startPrdDe: String(currentYear - 2),
    endPrdDe: String(currentYear),
  });

  const url = `${KOSIS_API_BASE}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`KOSIS API 오류: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as KosisApiResponse | KosisRawRow[];

  if (!Array.isArray(json)) {
    const errResp = json as KosisApiResponse;
    if (errResp.err) {
      throw new Error(`KOSIS API 오류 코드 ${errResp.err}: ${errResp.errMsg ?? ''}`);
    }
    return (errResp.DATA ?? []).map(normalizeKosisRow);
  }

  return json.map(normalizeKosisRow);
}
