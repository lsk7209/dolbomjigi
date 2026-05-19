/**
 * Next.js 15 동적 사이트맵 생성
 * /sitemap.xml 엔드포인트로 자동 서빙된다.
 */

import type { MetadataRoute } from 'next';
import { db } from '@/db/client';
import {
  robots,
  comparisons,
  guides,
  supportPrograms,
  regions,
  researchStudies,
} from '@/db/schema';
import { eq, isNotNull } from 'drizzle-orm';

const SITE_URL = 'https://dolbomjigi.com';

// ─────────────────────────────────────────
// 정적 경로
// ─────────────────────────────────────────

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

// ─────────────────────────────────────────
// 메인
// ─────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 병렬 쿼리 (DB 미연결 시 빈 배열 반환)
  const [
    robotRows,
    comparisonRows,
    guideRows,
    supportRows,
    sidoRows,
    researchRows,
  ] = await Promise.all([
    db
      .select({ slug: robots.slug, updated_at: robots.updated_at })
      .from(robots)
      .catch(() => [] as Array<{ slug: string; updated_at: Date | null }>),

    db
      .select({ slug: comparisons.slug, published_at: comparisons.published_at })
      .from(comparisons)
      .where(isNotNull(comparisons.published_at))
      .catch(() => [] as Array<{ slug: string; published_at: Date | null }>),

    db
      .select({ slug: guides.slug, published_at: guides.published_at })
      .from(guides)
      .where(isNotNull(guides.published_at))
      .catch(() => [] as Array<{ slug: string; published_at: Date | null }>),

    db
      .select({ slug: supportPrograms.slug, source_publication_date: supportPrograms.source_publication_date })
      .from(supportPrograms)
      .where(eq(supportPrograms.status, 'active'))
      .catch(() => [] as Array<{ slug: string; source_publication_date: Date | null }>),

    db
      .select({ slug: regions.slug })
      .from(regions)
      .where(eq(regions.level, 'sido'))
      .catch(() => [] as Array<{ slug: string }>),

    db
      .select({ slug: researchStudies.slug })
      .from(researchStudies)
      .catch(() => [] as Array<{ slug: string }>),
  ]);

  // /robot/[slug]
  const robotUrls: MetadataRoute.Sitemap = robotRows.map((r) => ({
    url: `${SITE_URL}/robot/${r.slug}`,
    lastModified: r.updated_at ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // /compare/[slug]
  const compareUrls: MetadataRoute.Sitemap = comparisonRows.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: c.published_at ?? new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // /guide/[slug]
  const guideUrls: MetadataRoute.Sitemap = guideRows.map((g) => ({
    url: `${SITE_URL}/guide/${g.slug}`,
    lastModified: g.published_at ?? new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // /support/region/[sido]
  const supportRegionUrls: MetadataRoute.Sitemap = sidoRows.map((r) => ({
    url: `${SITE_URL}/support/region/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // /info/[slug] — 지원사업 상세 페이지
  const infoUrls: MetadataRoute.Sitemap = supportRows.map((s) => ({
    url: `${SITE_URL}/info/${s.slug}`,
    lastModified: s.source_publication_date ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // /research/[slug]
  const researchUrls: MetadataRoute.Sitemap = researchRows.map((r) => ({
    url: `${SITE_URL}/research/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // /business/[slug] — bizinfo 연계 사업 상세 (정적 0.5 우선순위)
  // bizinfo_programs는 별도 공개 페이지 경로가 정해지면 추가
  const businessUrls: MetadataRoute.Sitemap = [];

  return [
    ...STATIC_ROUTES,
    ...robotUrls,
    ...compareUrls,
    ...guideUrls,
    ...supportRegionUrls,
    ...infoUrls,
    ...researchUrls,
    ...businessUrls,
  ];
}
