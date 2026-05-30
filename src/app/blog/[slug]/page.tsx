import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { blogPosts, authors } from '@/db/schema'
import { eq, isNotNull, desc, and, lte } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import AuthorBlock from '@/components/common/AuthorBlock'
import JsonLdScript from '@/components/seo/JsonLdScript'
import TableOfContents from '@/components/blog/TableOfContents'
import { markdownToHtml, extractToc } from '@/lib/markdown'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/config'
import Link from 'next/link'

export const revalidate = 3600
export const dynamicParams = true

// ─────────────────────────────────────────
// 정적 경로
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(isNotNull(blogPosts.published_at))
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 동적 메타데이터
// ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await db
    .select({ title_ko: blogPosts.title_ko, subtitle: blogPosts.subtitle, summary: blogPosts.summary, cover_image_url: blogPosts.cover_image_url })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .get()

  if (!post) return { title: '글을 찾을 수 없습니다' }

  const title = `${post.title_ko} | ${SITE_NAME}`
  const description = post.summary ?? post.subtitle ?? post.title_ko

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      siteName: SITE_NAME,
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
  }
}

// ─────────────────────────────────────────
// 카테고리 레이블
// ─────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  care_info: '돌봄 정보',
  product_review: '제품 리뷰',
  support_program: '지원사업',
  guide: '가이드',
  news: '뉴스',
}

const CATEGORY_COLOR: Record<string, string> = {
  care_info: 'bg-blue-100 text-blue-800',
  product_review: 'bg-purple-100 text-purple-800',
  support_program: 'bg-green-100 text-green-800',
  guide: 'bg-orange-100 text-orange-800',
  news: 'bg-gray-100 text-gray-700',
}

function formatDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ─────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const post = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .get()

  // 미발행(null) 또는 예약 공개 전(미래)이면 404
  if (!post || !post.published_at) notFound()
  if (new Date(post.published_at).getTime() > Date.now()) notFound()

  const author = post.author_id
    ? await db.select().from(authors).where(eq(authors.id, post.author_id)).get()
    : null

  // 관련 포스트 (같은 카테고리, 3개)
  const relatedPosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title_ko: blogPosts.title_ko,
      category: blogPosts.category,
      reading_time_minutes: blogPosts.reading_time_minutes,
      published_at: blogPosts.published_at,
    })
    .from(blogPosts)
    .where(and(isNotNull(blogPosts.published_at), lte(blogPosts.published_at, new Date())))
    .orderBy(desc(blogPosts.published_at))
    .limit(6)
    .catch(() => [])
    .then((rows) => rows.filter((r) => r.slug !== slug).slice(0, 3))

  const html = markdownToHtml(post.body_md)
  const toc = extractToc(post.body_md)

  const today = new Date(post.updated_at ?? post.published_at)
  const todayStr = today.toISOString().slice(0, 10)

  const jsonLdData = [
    buildArticleJsonLd({
      title: post.title_ko,
      description: post.summary ?? post.title_ko,
      datePublished: new Date(post.published_at).toISOString().slice(0, 10),
      dateModified: todayStr,
      authorName: author?.name ?? SITE_NAME,
      url: `${SITE_URL}/blog/${slug}`,
      imageUrl: post.cover_image_url ?? undefined,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '블로그', url: `${SITE_URL}/blog` },
      { name: post.title_ko, url: `${SITE_URL}/blog/${slug}` },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      {/* 브레드크럼 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <nav className="text-xs text-gray-400" aria-label="breadcrumb">
            <ol className="flex items-center gap-1 flex-wrap">
              <li><Link href="/" className="hover:text-gray-700">홈</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/blog" className="hover:text-gray-700">블로그</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700 font-medium line-clamp-1">{post.title_ko}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 w-full">
        {/* 기사 헤더 */}
        <header className="mb-6 max-w-2xl">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mb-3 ${CATEGORY_COLOR[post.category] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {CATEGORY_LABEL[post.category] ?? post.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
            {post.title_ko}
          </h1>
          {post.subtitle && (
            <p className="text-base text-gray-500 leading-snug mb-3">{post.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {author && <span>by {author.name}</span>}
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
            {post.reading_time_minutes && <span>{post.reading_time_minutes}분 읽기</span>}
          </div>
        </header>

        {/* 커버 이미지 */}
        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title_ko}
            className="w-full max-w-2xl h-48 sm:h-64 object-cover rounded-2xl mb-6"
          />
        )}

        {/* 2컬럼 레이아웃 (TOC + 본문) */}
        <div className="flex gap-10 items-start">
          {/* TOC — 데스크탑 sticky sidebar */}
          {toc.length > 1 && <TableOfContents items={toc} />}

          {/* 본문 */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* AnswerBlock */}
            {post.summary && <AnswerBlock>{post.summary}</AnswerBlock>}

            {/* 모바일 TOC */}
            {toc.length > 1 && (
              <div className="lg:hidden">
                <TableOfContents items={toc} />
              </div>
            )}

            {/* 본문 */}
            <article
              className="prose-custom text-gray-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* 태그 */}
            {post.tags_json && (() => {
              try {
                const tags: string[] = JSON.parse(post.tags_json)
                return tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null
              } catch { return null }
            })()}

            {/* 관련 포스트 */}
            {relatedPosts.length > 0 && (
              <section aria-label="관련 글" className="pt-6 border-t border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-3">관련 글</h2>
                <ul className="flex flex-col gap-2">
                  {relatedPosts.map((rp) => (
                    <li key={rp.id}>
                      <Link
                        href={`/blog/${rp.slug}`}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition-colors"
                      >
                        <span className="text-sm text-gray-800 line-clamp-1">{rp.title_ko}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {rp.reading_time_minutes ? `${rp.reading_time_minutes}분` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* AuthorBlock */}
            {author && (
              <AuthorBlock
                author={{ name: author.name, role: author.role, slug: author.slug }}
                confirmedAt={todayStr}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
