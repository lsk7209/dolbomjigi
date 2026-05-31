/**
 * RSS 2.0 피드 엔드포인트
 * Naver/Google RSS 리더 및 검색 봇을 위한 피드 생성
 *
 * GET /api/feed → application/rss+xml
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { robots, supportPrograms } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1시간 캐시

const SITE_TITLE = '돌봄지기 - 돌봄로봇 종합 정보';
const SITE_DESCRIPTION =
  '노인·장애인 돌봄로봇, 재활로봇, 지원사업 정보를 한눈에. 효돌, 다솜, 보미 등 국내 돌봄로봇 비교 가이드.';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfcDate(date: Date | null | undefined): string {
  if (!date) return new Date().toUTCString();
  return new Date(date).toUTCString();
}

export async function GET(): Promise<NextResponse> {
  // 최신 로봇 13개
  const latestRobots = await db
    .select({
      slug: robots.slug,
      name_ko: robots.name_ko,
      description_short: robots.description_short,
      updated_at: robots.updated_at,
      manufacturer: robots.manufacturer,
    })
    .from(robots)
    .orderBy(desc(robots.updated_at))
    .limit(13);

  // 최신 지원사업 5개 (검토 완료 항목만)
  const latestPrograms = await db
    .select({
      slug: supportPrograms.slug,
      name_ko: supportPrograms.name_ko,
      source_url: supportPrograms.source_url,
      source_publication_date: supportPrograms.source_publication_date,
      status: supportPrograms.status,
    })
    .from(supportPrograms)
    .where(isNotNull(supportPrograms.source_publication_date))
    .orderBy(desc(supportPrograms.source_publication_date))
    .limit(5);

  const now = new Date().toUTCString();

  const robotItems = latestRobots
    .map((robot) => {
      const url = `${SITE_URL}/robot/${robot.slug}`;
      const title = escapeXml(`${robot.name_ko} - ${robot.manufacturer} 돌봄로봇`);
      const desc = escapeXml(
        robot.description_short ?? `${robot.name_ko}의 상세 정보, 가격, 기능을 확인하세요.`
      );
      const date = toRfcDate(robot.updated_at);

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <pubDate>${date}</pubDate>
    </item>`;
    })
    .join('\n');

  const programItems = latestPrograms
    .map((prog) => {
      const url = `${SITE_URL}/support/national/${prog.slug}`;
      const title = escapeXml(prog.name_ko);
      const desc = escapeXml(
        `${prog.name_ko} 지원사업 안내. 신청 자격, 방법, 일정을 확인하세요.`
      );
      const date = toRfcDate(prog.source_publication_date);

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <pubDate>${date}</pubDate>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
${robotItems}
${programItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
