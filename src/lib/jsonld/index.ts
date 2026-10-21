import type { Robot } from '@/types'
import { SITE_URL } from '@/lib/config'

// ---------------------------------------------------------------------------
// Product (돌봄 로봇)
// ---------------------------------------------------------------------------

/**
 * 돌봄 로봇 제품용 Product JSON-LD를 생성한다.
 */
export function buildProductJsonLd(robot: Robot): object {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: robot.name_ko,
    category: robot.category,
  }

  if (robot.manufacturer && !/확인|브랜드|판매판/.test(robot.manufacturer)) ld.manufacturer = { '@type':'Organization', name:robot.manufacturer }
  if (robot.name_en) ld['alternateName'] = robot.name_en
  if (robot.description) ld['description'] = robot.description
  if (robot.image_url) ld['image'] = robot.image_url

  return ld
}

// ---------------------------------------------------------------------------
// FAQPage
// ---------------------------------------------------------------------------

/**
 * FAQ 목록에서 FAQPage JSON-LD를 생성한다.
 */
export function buildFAQJsonLd(faqs: { q: string; a: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  }
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

/**
 * 브레드크럼 탐색 경로에서 BreadcrumbList JSON-LD를 생성한다.
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: url,
    })),
  }
}

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

export interface ArticleJsonLdParams {
  title: string
  description: string
  datePublished?: string
  dateModified?: string
  authorName: string
  url: string
  imageUrl?: string
}

/**
 * 아티클(뉴스/블로그 포스트) JSON-LD를 생성한다.
 */
export function buildArticleJsonLd(params: ArticleJsonLdParams): object {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    author: {
      '@type': params.authorName.includes('편집팀') ? 'Organization' : 'Person',
      name: params.authorName,
      ...(params.authorName.includes('편집팀') ? { '@id': `${SITE_URL}/#editorial-team`, url: `${SITE_URL}/authors/editor-team` } : {}),
    },
    url: params.url,
  }

  if (params.datePublished && Number.isFinite(Date.parse(params.datePublished))) ld.datePublished = params.datePublished
  if (params.dateModified && Number.isFinite(Date.parse(params.dateModified))) ld.dateModified = params.dateModified

  if (params.imageUrl) ld['image'] = params.imageUrl

  return ld
}

// ---------------------------------------------------------------------------
// GovernmentService
// ---------------------------------------------------------------------------

export interface GovernmentServiceJsonLdParams {
  name: string
  description: string
  url: string
  areaServed: string
}

/**
 * 정부·지자체 지원 서비스용 GovernmentService JSON-LD를 생성한다.
 */
export function buildGovernmentServiceJsonLd(
  params: GovernmentServiceJsonLdParams,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.name,
    description: params.description,
    url: params.url,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: params.areaServed,
    },
    // This site describes a program; it is not the government service provider.
  }
}

// ---------------------------------------------------------------------------
// HowTo
// ---------------------------------------------------------------------------

export interface HowToJsonLdParams {
  name: string
  steps: string[]
}

/**
 * 절차 안내를 위한 HowTo JSON-LD를 생성한다.
 */
export function buildHowToJsonLd(params: HowToJsonLdParams): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: params.name,
    step: params.steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text,
    })),
  }
}
