import type { Robot } from '@/types'

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
    manufacturer: {
      '@type': 'Organization',
      name: robot.manufacturer,
    },
    category: robot.category,
  }

  if (robot.name_en) ld['alternateName'] = robot.name_en
  if (robot.description) ld['description'] = robot.description
  if (robot.image_url) ld['image'] = robot.image_url

  const hasPriceRange =
    robot.price_min !== undefined ||
    robot.price_max !== undefined ||
    robot.subscription_monthly !== undefined

  if (hasPriceRange) {
    const offers: Record<string, unknown> = {
      '@type': 'AggregateOffer',
      priceCurrency: 'KRW',
    }
    if (robot.price_min !== undefined) offers['lowPrice'] = robot.price_min
    if (robot.price_max !== undefined) offers['highPrice'] = robot.price_max
    ld['offers'] = offers
  }

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
  datePublished: string
  dateModified: string
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
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    url: params.url,
  }

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
    '@type': 'GovernmentService',
    name: params.name,
    description: params.description,
    url: params.url,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: params.areaServed,
    },
    provider: {
      '@type': 'GovernmentOrganization',
      name: '대한민국 정부',
    },
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
