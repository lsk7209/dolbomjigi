/**
 * 보건복지부 RSS 수집 모듈
 * https://www.mohw.go.kr 의 공지사항 RSS를 수집하여 돌봄로봇 관련 항목을 필터링한다.
 */

import { TARGET_KEYWORDS } from './bizinfo';

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────

const MOHW_RSS_URL =
  'https://www.mohw.go.kr/react/al/sal0301ls.jsp?PAR_MENU_ID=04&MENU_ID=0403&page=1&searchKey=&searchWord=&BOARD_ID=140';

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

export interface MohwRssItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  matched_keywords: string[];
}

// ─────────────────────────────────────────
// XML 파싱 헬퍼
// ─────────────────────────────────────────

/**
 * 정규식을 이용한 간단한 RSS XML 파서.
 * Edge runtime에서 DOMParser를 사용할 수 없는 환경을 고려한다.
 */
function parseRssXml(xml: string): Array<{
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string | null;
    description: string | null;
  }> = [];

  // <item>...</item> 블록 추출 (다중 라인 포함)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const block = itemMatch[1];

    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    const description = extractTag(block, 'description');

    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: decodeEntities(link),
        pubDate: pubDate ? decodeEntities(pubDate) : null,
        description: description ? decodeEntities(description) : null,
      });
    }
  }

  return items;
}

/**
 * XML 태그 내용 추출 (CDATA 포함)
 */
function extractTag(block: string, tag: string): string | null {
  // CDATA 형식: <tag><![CDATA[...]]></tag>
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    'i'
  );
  const cdataMatch = cdataRegex.exec(block);
  if (cdataMatch) return cdataMatch[1].trim();

  // 일반 텍스트 형식: <tag>...</tag>
  const textRegex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const textMatch = textRegex.exec(block);
  if (textMatch) return textMatch[1].trim();

  return null;
}

/**
 * HTML 엔티티 디코딩
 */
function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ─────────────────────────────────────────
// 키워드 필터
// ─────────────────────────────────────────

function matchKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return TARGET_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
}

// ─────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────

/**
 * 보건복지부 공지사항 RSS를 수집하여 TARGET_KEYWORDS에 매칭된 항목만 반환한다.
 * DB 저장은 호출자(run-daily.ts)가 처리한다.
 *
 * @returns 필터링된 MohwRssItem 목록
 */
export async function fetchMohwRss(): Promise<MohwRssItem[]> {
  const res = await fetch(MOHW_RSS_URL, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': 'DolbomjigiBot/1.0 (+https://dolbomjigi.com)',
    },
  });

  if (!res.ok) {
    throw new Error(`보건복지부 RSS 요청 실패: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const rawItems = parseRssXml(xml);

  const filtered: MohwRssItem[] = [];

  for (const raw of rawItems) {
    const searchText = [raw.title, raw.description ?? ''].join(' ');
    const matched = matchKeywords(searchText);

    if (matched.length > 0) {
      filtered.push({
        title: raw.title,
        link: raw.link,
        pubDate: raw.pubDate,
        description: raw.description,
        matched_keywords: matched,
      });
    }
  }

  return filtered;
}
