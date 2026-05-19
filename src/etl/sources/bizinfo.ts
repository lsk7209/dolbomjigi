/**
 * bizinfo.go.kr API 수집 모듈
 * 공공기관 지원사업 공고를 수집하여 bizinfo_programs 테이블에 upsert한다.
 */

import { db } from '@/db/client';
import { bizinfoPrograms } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

const BIZINFO_API_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';

export const TARGET_KEYWORDS: string[] = [
  '돌봄로봇',
  '돌봄 로봇',
  '반려로봇',
  '반려 로봇',
  'AI 돌봄',
  'AI돌봄',
  '시니어 로봇',
  '시니어로봇',
  '노인 돌봄',
  '노인돌봄',
  '독거 노인',
  '독거노인',
  '지능형 로봇',
  '지능형로봇',
  '효돌',
  '다솜',
  '꿈돌이',
  '광명이',
  '보미',
  '재활 로봇',
  '재활로봇',
  '복지용구',
];

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

export interface BizinfoRawItem {
  pbancId?: string;
  pblanc_id?: string;
  bsnsSupportTtl?: string; // 공고명
  instNm?: string;          // 기관명
  rgnNm?: string;           // 지역명
  srchPosbRegnNm?: string;  // 검색가능지역명
  bizTrgtChc?: string;      // 사업분야
  reqstBgngYmd?: string;    // 접수시작일
  reqstEndYmd?: string;     // 접수종료일
  pblancUrl?: string;       // 공고URL
  [key: string]: unknown;
}

export interface BizinfoItem {
  pblanc_id: string;
  title: string;
  dept: string | null;
  region: string | null;
  field: string | null;
  start_date: Date | null;
  end_date: Date | null;
  detail_url: string | null;
  matched_keywords: string[];
  raw: BizinfoRawItem;
}

// ─────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────

function parseKoreanDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  // YYYYMMDD 형식
  const clean = dateStr.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  const year = parseInt(clean.slice(0, 4), 10);
  const month = parseInt(clean.slice(4, 6), 10) - 1;
  const day = parseInt(clean.slice(6, 8), 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function extractMatchedKeywords(item: BizinfoRawItem): string[] {
  const searchText = [
    item.bsnsSupportTtl ?? '',
    item.instNm ?? '',
    item.rgnNm ?? '',
    item.bizTrgtChc ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return TARGET_KEYWORDS.filter((kw) => searchText.includes(kw.toLowerCase()));
}

function normalizeItem(raw: BizinfoRawItem): BizinfoItem | null {
  const id = raw.pbancId ?? raw.pblanc_id;
  if (!id) return null;

  const matched = extractMatchedKeywords(raw);
  if (matched.length === 0) return null;

  return {
    pblanc_id: String(id),
    title: raw.bsnsSupportTtl ?? '',
    dept: raw.instNm ?? null,
    region: raw.rgnNm ?? raw.srchPosbRegnNm ?? null,
    field: raw.bizTrgtChc ?? null,
    start_date: parseKoreanDate(raw.reqstBgngYmd),
    end_date: parseKoreanDate(raw.reqstEndYmd),
    detail_url: raw.pblancUrl ?? null,
    matched_keywords: matched,
    raw,
  };
}

// ─────────────────────────────────────────
// API 호출
// ─────────────────────────────────────────

interface BizinfoApiResponse {
  resultCode?: string;
  items?: BizinfoRawItem[];
  data?: BizinfoRawItem[];
  [key: string]: unknown;
}

async function fetchPage(
  apiKey: string,
  pageNo: number,
  region?: string
): Promise<BizinfoRawItem[]> {
  const params = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: 'json',
    searchCnt: '100',
    pageNo: String(pageNo),
  });

  if (region) {
    params.set('searchPosblRegnNm', region);
  }

  const url = `${BIZINFO_API_URL}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Edge runtime 호환: signal은 AbortController로 별도 처리
  });

  if (!res.ok) {
    throw new Error(`bizinfo API 오류: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as BizinfoApiResponse;

  // API 응답 구조 정규화
  const items: BizinfoRawItem[] =
    (json.items as BizinfoRawItem[]) ??
    (json.data as BizinfoRawItem[]) ??
    [];

  return items;
}

// ─────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────

/**
 * bizinfo.go.kr에서 돌봄로봇 관련 지원사업 공고를 수집한다.
 *
 * @param apiKey - bizinfo API 인증키
 * @param region - 지역명 필터 (예: '서울특별시'). 없으면 전국 검색.
 * @returns 매칭된 BizinfoItem 목록
 */
export async function fetchBizinfo(
  apiKey: string,
  region?: string
): Promise<BizinfoItem[]> {
  const allItems: BizinfoItem[] = [];
  let pageNo = 1;
  const maxPages = 5; // 안전 상한 (페이지당 100건 × 5 = 최대 500건)

  while (pageNo <= maxPages) {
    const rawItems = await fetchPage(apiKey, pageNo, region);
    if (rawItems.length === 0) break;

    for (const raw of rawItems) {
      const item = normalizeItem(raw);
      if (item) allItems.push(item);
    }

    if (rawItems.length < 100) break; // 마지막 페이지
    pageNo++;
  }

  return allItems;
}

// ─────────────────────────────────────────
// DB upsert
// ─────────────────────────────────────────

/**
 * 수집된 BizinfoItem을 bizinfo_programs 테이블에 upsert한다.
 * pblanc_id 기준으로 중복 방지.
 */
export async function upsertBizinfoItems(items: BizinfoItem[]): Promise<void> {
  const now = new Date();

  for (const item of items) {
    const existing = await db
      .select({ id: bizinfoPrograms.id })
      .from(bizinfoPrograms)
      .where(eq(bizinfoPrograms.pblanc_id, item.pblanc_id))
      .limit(1);

    const payload = {
      pblanc_id: item.pblanc_id,
      title: item.title,
      dept: item.dept,
      region: item.region,
      field: item.field,
      start_date: item.start_date,
      end_date: item.end_date,
      detail_url: item.detail_url,
      matched_keywords: JSON.stringify(item.matched_keywords),
      raw_json: JSON.stringify(item.raw),
      fetched_at: now,
    };

    if (existing.length > 0) {
      await db
        .update(bizinfoPrograms)
        .set(payload)
        .where(eq(bizinfoPrograms.pblanc_id, item.pblanc_id));
    } else {
      await db.insert(bizinfoPrograms).values(payload);
    }
  }
}
