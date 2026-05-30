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
import { eq, isNotNull, isNull, and, lte } from 'drizzle-orm';
import { SITE_URL } from '@/lib/config';

export const revalidate = 86400;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/robot`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${SITE_URL}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/guide`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/support`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/info`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/research`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/ranking`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/business`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
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
    researchRows,
    infoRows,
    blogRows,
  ] = await Promise.all([
    db.select({ slug: robots.slug, updated_at: robots.updated_at }).from(robots)
      .catch(() => [] as Array<{ slug: string; updated_at: Date | null }>),

    db.select({ slug: comparisons.slug, published_at: comparisons.published_at })
      .from(comparisons).where(isNotNull(comparisons.published_at))
      .catch(() => [] as Array<{ slug: string; published_at: Date | null }>),

    db.select({ slug: guides.slug, published_at: guides.published_at })
      .from(guides).where(isNotNull(guides.published_at))
      .catch(() => [] as Array<{ slug: string; published_at: Date | null }>),

    db.select({ slug: supportPrograms.slug })
      .from(supportPrograms).where(isNull(supportPrograms.region_id))
      .catch(() => [] as Array<{ slug: string }>),

    db.select({ slug: regions.slug, sido_code: regions.sido_code })
      .from(regions).where(eq(regions.level, 'sido'))
      .catch(() => [] as Array<{ slug: string; sido_code: string }>),

    db.select({ slug: regions.slug, sido_code: regions.sido_code })
      .from(regions).where(eq(regions.level, 'sigungu'))
      .catch(() => [] as Array<{ slug: string; sido_code: string }>),

    db.select({ slug: researchStudies.slug }).from(researchStudies)
      .catch(() => [] as Array<{ slug: string }>),

    db.select({ slug: infoArticles.slug, updated_at: infoArticles.updated_at })
      .from(infoArticles)
      .catch(() => [] as Array<{ slug: string; updated_at: Date | null }>),

    db.select({ slug: blogPosts.slug, updated_at: blogPosts.updated_at })
      .from(blogPosts)
      .where(and(isNotNull(blogPosts.published_at), lte(blogPosts.published_at, new Date())))
      .catch(() => [] as Array<{ slug: string; updated_at: Date | null }>),
  ]);

  const sidoMap = new Map(sidoRows.map((r) => [r.sido_code, r.slug]));

  const robotUrls: MetadataRoute.Sitemap = robotRows.map((r) => ({
    url: `${SITE_URL}/robot/${r.slug}`,
    lastModified: r.updated_at ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const compareUrls: MetadataRoute.Sitemap = comparisonRows.map((c) => ({
    url: `${SITE_URL}/compare/${c.slug}`,
    lastModified: c.published_at ?? new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const guideUrls: MetadataRoute.Sitemap = guideRows.map((g) => ({
    url: `${SITE_URL}/guide/${g.slug}`,
    lastModified: g.published_at ?? new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const nationalSupportUrls: MetadataRoute.Sitemap = nationalSupportRows.map((s) => ({
    url: `${SITE_URL}/support/national/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const sidoRegionUrls: MetadataRoute.Sitemap = sidoRows.map((r) => ({
    url: `${SITE_URL}/support/region/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const sigunguRegionUrls: MetadataRoute.Sitemap = sigunguRows.map((r) => {
    const sidoSlug = sidoMap.get(r.sido_code) ?? r.sido_code;
    return {
      url: `${SITE_URL}/support/region/${sidoSlug}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  const researchUrls: MetadataRoute.Sitemap = researchRows.map((r) => ({
    url: `${SITE_URL}/research/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const infoUrls: MetadataRoute.Sitemap = infoRows.map((r) => ({
    url: `${SITE_URL}/info/${r.slug}`,
    lastModified: r.updated_at ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const rankingUrls: MetadataRoute.Sitemap = RANKING_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/ranking/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const businessUrls: MetadataRoute.Sitemap = BUSINESS_SLUGS.map((slug) => ({
    url: `${SITE_URL}/business/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogRows.map((r) => ({
    url: `${SITE_URL}/blog/${r.slug}`,
    lastModified: r.updated_at ?? new Date(),
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
