import type { Metadata } from 'next'
import { db } from '@/db/client'
import { blogPosts, authors } from '@/db/schema'
import { desc, eq, isNotNull, and, lte } from 'drizzle-orm'
import { SITE_URL, SITE_NAME } from '@/lib/config'
import { getBlogThumbnailPath } from '@/lib/blog-thumbnails'
import Link from 'next/link'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `돌봄로봇 블로그 — 최신 정보·가이드·뉴스 | ${SITE_NAME}`,
  description:
    '돌봄로봇 활용법, 지원사업 정보, 제품 비교, 재활로봇 등 어르신 돌봄에 관한 최신 정보를 전달합니다.',
  openGraph: {
    title: `돌봄로봇 블로그 | ${SITE_NAME}`,
    description: '돌봄로봇 활용법, 지원사업, 제품 리뷰 최신 글',
    url: `${SITE_URL}/blog`,
    type: 'website',
    siteName: SITE_NAME,
  },
  alternates: { canonical: `${SITE_URL}/blog` },
}

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

export default async function BlogListPage() {
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title_ko: blogPosts.title_ko,
      subtitle: blogPosts.subtitle,
      summary: blogPosts.summary,
      cover_image_url: blogPosts.cover_image_url,
      category: blogPosts.category,
      reading_time_minutes: blogPosts.reading_time_minutes,
      published_at: blogPosts.published_at,
      author_name: authors.name,
    })
    .from(blogPosts)
    .leftJoin(authors, eq(blogPosts.author_id, authors.id))
    .where(and(isNotNull(blogPosts.published_at), lte(blogPosts.published_at, new Date())))
    .orderBy(desc(blogPosts.published_at))
    .catch(() => [])

  const categories = Array.from(new Set(posts.map((p) => p.category)))

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-indigo-600 font-medium mb-1">돌봄지기 &rsaquo; 블로그</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄로봇 블로그
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
            어르신 돌봄로봇 활용법, 지원사업 정보, 제품 리뷰, 재활로봇까지. 필요한 정보를 쉽게 전달합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 w-full flex flex-col gap-6">
        {/* 카테고리 필터 */}
        {categories.length > 1 && (
          <nav aria-label="카테고리 필터" className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLOR[cat] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {CATEGORY_LABEL[cat] ?? cat}
              </span>
            ))}
          </nav>
        )}

        {/* 카드 그리드 */}
        {posts.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">
            아직 게시된 글이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-indigo-100 transition-all overflow-hidden"
              >
                {/* 커버 이미지 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getBlogThumbnailPath({
                    coverImageUrl: post.cover_image_url,
                    category: post.category,
                    title: post.title_ko,
                    slug: post.slug,
                  })}
                  alt=""
                  className="w-full h-40 object-cover bg-gray-50"
                  loading="lazy"
                  aria-hidden="true"
                />

                <div className="flex flex-col gap-2 p-4 flex-1">
                  {/* 카테고리 배지 */}
                  <span
                    className={`self-start inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[post.category] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {CATEGORY_LABEL[post.category] ?? post.category}
                  </span>

                  {/* 제목 */}
                  <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {post.title_ko}
                  </h2>

                  {/* 부제목 */}
                  {post.subtitle && (
                    <p className="text-xs text-gray-600 leading-snug line-clamp-1">
                      {post.subtitle}
                    </p>
                  )}

                  {/* 요약 */}
                  {post.summary && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                      {post.summary}
                    </p>
                  )}

                  {/* 메타 */}
                  <div className="flex items-center justify-between mt-auto pt-2 text-xs text-gray-400">
                    <span>{formatDate(post.published_at)}</span>
                    {post.reading_time_minutes && (
                      <span>{post.reading_time_minutes}분 읽기</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 border-t border-gray-100 pt-6 mt-4">
          <Link href="/" className="hover:text-gray-700">홈</Link>
          <Link href="/guide" className="hover:text-gray-700">이용 가이드</Link>
          <Link href="/support" className="hover:text-gray-700">지원사업</Link>
          <Link href="/robot" className="hover:text-gray-700">제품 목록</Link>
        </footer>
      </div>
    </div>
  )
}
