import { SITE_URL } from '@/lib/config'

const CATEGORY_THUMBNAILS: Record<string, string> = {
  care_info: '/images/blog-thumbnails/care-info.svg',
  product_review: '/images/blog-thumbnails/product-review.svg',
  support_program: '/images/blog-thumbnails/support-program.svg',
  guide: '/images/blog-thumbnails/guide.svg',
  news: '/images/blog-thumbnails/news.svg',
}

const KEYWORD_THUMBNAILS: Array<{ pattern: RegExp; path: string }> = [
  { pattern: /낙상|넘어|fall/i, path: '/images/blog-thumbnails/fall-detection.svg' },
  { pattern: /복약|약|medication/i, path: '/images/blog-thumbnails/medication.svg' },
  { pattern: /배회|야간|wandering|night/i, path: '/images/blog-thumbnails/night-care.svg' },
  { pattern: /지원|보조금|사업|subsidy|program/i, path: '/images/blog-thumbnails/support-program.svg' },
  { pattern: /비교|리뷰|가격|review|compare/i, path: '/images/blog-thumbnails/product-review.svg' },
]

export function getBlogThumbnailPath(input: {
  coverImageUrl?: string | null
  category?: string | null
  title?: string | null
  slug?: string | null
}): string {
  if (input.coverImageUrl) return input.coverImageUrl

  const searchable = `${input.title ?? ''} ${input.slug ?? ''}`
  const keywordMatch = KEYWORD_THUMBNAILS.find((entry) => entry.pattern.test(searchable))
  if (keywordMatch) return keywordMatch.path

  return CATEGORY_THUMBNAILS[input.category ?? ''] ?? CATEGORY_THUMBNAILS.care_info
}

export function getBlogThumbnailUrl(input: {
  coverImageUrl?: string | null
  category?: string | null
  title?: string | null
  slug?: string | null
}): string {
  const path = getBlogThumbnailPath(input)
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path}`
}
