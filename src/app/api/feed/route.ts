/**
 * RSS 2.0 피드 엔드포인트
 * Naver/Google RSS 리더 및 검색 봇을 위한 피드 생성
 *
 * GET /api/feed → application/rss+xml
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { blogPosts } from '@/db/schema';
import { and, desc, isNotNull, lte } from 'drizzle-orm';
import { SITE_URL } from '@/lib/config';
import { getBlogThumbnailUrl } from '@/lib/blog-thumbnails';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1시간 캐시

const SITE_TITLE = '돌봄지기 - 돌봄로봇 종합 정보';
const SITE_DESCRIPTION =
  '노인·장애인 돌봄로봇, 재활로봇, 지원사업 정보를 한눈에. 효돌, 다솜, 보미 등 국내 돌봄로봇 비교 가이드.';

function escapeXml(str: string): string {
  const normalized = str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  return normalized
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
  const latestPosts = await db
    .select({
      slug: blogPosts.slug,
      title_ko: blogPosts.title_ko,
      summary: blogPosts.summary,
      subtitle: blogPosts.subtitle,
      cover_image_url: blogPosts.cover_image_url,
      category: blogPosts.category,
      published_at: blogPosts.published_at,
      updated_at: blogPosts.updated_at,
    })
    .from(blogPosts)
    .where(and(isNotNull(blogPosts.published_at), lte(blogPosts.published_at, new Date())))
    .orderBy(desc(blogPosts.published_at))
    .limit(15);

  const now = new Date().toUTCString();

  const postItems = latestPosts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const title = escapeXml(post.title_ko);
      const desc = escapeXml(post.summary ?? post.subtitle ?? post.title_ko);
      const date = toRfcDate(post.published_at ?? post.updated_at);
      const thumbnail = escapeXml(
        getBlogThumbnailUrl({
          coverImageUrl: post.cover_image_url,
          category: post.category,
          title: post.title_ko,
          slug: post.slug,
        })
      );

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${desc}</description>
      <pubDate>${date}</pubDate>
      <media:thumbnail url="${thumbnail}" width="1200" height="630"/>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
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
${postItems}
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
