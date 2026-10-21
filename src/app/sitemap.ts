import type { MetadataRoute } from 'next';
import { db } from '@/db/client';
import {
  robots,
  comparisons,
  guides,
  supportPrograms,
  regions,
  researchStudies,
  infoArticles,
  blogPosts,
} from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { SITE_URL } from '@/lib/config';
import { publicAtOrBefore } from '@/lib/publication';

export const dynamic = 'force-dynamic';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/robot`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${SITE_URL}/compare`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/guide`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/support`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/info`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/research`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/ranking`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/business`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
];

const RANKING_CATEGORIES = [
  'best-value', 'senior-friendly', 'government-supported',
  'companion', 'senior-care', 'rehabilitation', 'monitoring',
];

const BUSINESS_SLUGS = ['nursing-home', 'welfare-center'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    robotRows,
    comparisonRows,
    guideRows,
    nationalSupportRows,
    sidoRows,
    sigunguRows,
    reviewedProgramRows,
    researchRows,
    infoRows,
    blogRows,
  ] = await Promise.all([
    db.select({ slug: robots.slug, updated_at: robots.updated_at }).from(robots),

    db.select({ slug: comparisons.slug, published_at: comparisons.published_at })
      .from(comparisons).where(publicAtOrBefore(comparisons.published_at)),

    db.select({ slug: guides.slug, published_at: guides.published_at })
      .from(guides).where(publicAtOrBefore(guides.published_at)),

    db.select({ slug: supportPrograms.slug })
      .from(supportPrograms).where(and(isNull(supportPrograms.region_id), eq(supportPrograms.human_reviewed, true))),

    db.select({ slug: regions.slug, sido_code: regions.sido_code, id: regions.id })
      .from(regions).where(eq(regions.level, 'sido')),

    db.select({ slug: regions.slug, sido_code: regions.sido_code, id: regions.id })
      .from(regions).where(eq(regions.level, 'sigungu')),

    db.select({ region_id: supportPrograms.region_id })
      .from(supportPrograms).where(eq(supportPrograms.human_reviewed, true)),

    db.select({ slug: researchStudies.slug }).from(researchStudies),

    db.select({ slug: infoArticles.slug, updated_at: infoArticles.updated_at })
      .from(infoArticles).where(publicAtOrBefore(infoArticles.published_at)),

    db.select({ slug: blogPosts.slug, updated_at: blogPosts.updated_at })
      .from(blogPosts)
      .where(publicAtOrBefore(blogPosts.published_at)),
  ]);

  const sidoMap = new Map(sidoRows.map((r) => [r.sido_code, r.slug]));
  const reviewedRegionIds = new Set(reviewedProgramRows.map((r) => r.region_id).filter((id): id is number => id !== null));
  const reviewedSidoCodes = new Set([
    ...sidoRows.filter((r) => reviewedRegionIds.has(r.id)).map((r) => r.sido_code),
    ...sigunguRows.filter((r) => reviewedRegionIds.has(r.id)).map((r) => r.sido_code),
  ]);

  const robotUrls: MetadataRoute.Sitemap = robotRows.map((r) => ({
    url: `${SITE_URL}/robot/${r.slug}`,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const compareUrls: MetadataRoute.Sitemap = comparisonRows.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const guideUrls: MetadataRoute.Sitemap = guideRows.map((g) => ({
    url: `${SITE_URL}/guide/${g.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const nationalSupportUrls: MetadataRoute.Sitemap = nationalSupportRows.map((s) => ({
    url: `${SITE_URL}/support/national/${s.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const sidoRegionUrls: MetadataRoute.Sitemap = sidoRows.filter((r) => reviewedSidoCodes.has(r.sido_code)).map((r) => ({
    url: `${SITE_URL}/support/region/${r.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const sigunguRegionUrls: MetadataRoute.Sitemap = sigunguRows.filter((r) => reviewedRegionIds.has(r.id) && sidoMap.has(r.sido_code)).map((r) => {
    const sidoSlug = sidoMap.get(r.sido_code)!;
    return {
      url: `${SITE_URL}/support/region/${sidoSlug}/${r.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  const researchUrls: MetadataRoute.Sitemap = researchRows.map((r) => ({
    url: `${SITE_URL}/research/${r.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const infoUrls: MetadataRoute.Sitemap = infoRows.map((r) => ({
    url: `${SITE_URL}/info/${r.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const rankingUrls: MetadataRoute.Sitemap = RANKING_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/ranking/${cat}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const businessUrls: MetadataRoute.Sitemap = BUSINESS_SLUGS.map((slug) => ({
    url: `${SITE_URL}/business/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogRows.map((r) => ({
    url: `${SITE_URL}/blog/${r.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    ...STATIC_ROUTES,
    ...blogUrls,
    ...robotUrls,
    ...compareUrls,
    ...guideUrls,
    ...nationalSupportUrls,
    ...sidoRegionUrls,
    ...sigunguRegionUrls,
    ...researchUrls,
    ...infoUrls,
    ...rankingUrls,
    ...businessUrls,
  ];
}
