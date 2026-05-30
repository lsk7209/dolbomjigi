import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { authors, guides, comparisons } from '@/db/schema'
import { eq, or } from 'drizzle-orm'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: authors.slug }).from(authors)
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
  const author = await db
    .select()
    .from(authors)
    .where(eq(authors.slug, slug))
    .get()

  if (!author) return { title: '저자를 찾을 수 없습니다' }

  const title = `${author.name} | 돌봄지기 저자 프로필`
  const description =
    author.bio_short ??
    `${author.name}(${author.role})의 돌봄지기 저자 프로필 페이지입니다.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
    alternates: {
      canonical: `${SITE_URL}/authors/${slug}`,
    },
  }
}

// ─────────────────────────────────────────
// credentials_json 파싱
// ─────────────────────────────────────────
function parseCredentials(json: string | null | undefined): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed.map(String)
    if (typeof parsed === 'object') return Object.values(parsed).map(String)
    return [String(parsed)]
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const author = await db
    .select()
    .from(authors)
    .where(eq(authors.slug, slug))
    .get()

  if (!author) notFound()

  // 이 저자가 작성한 가이드
  const authoredGuides = await db
    .select({
      id: guides.id,
      slug: guides.slug,
      title_ko: guides.title_ko,
      persona_group: guides.persona_group,
      published_at: guides.published_at,
    })
    .from(guides)
    .where(eq(guides.author_id, author.id))

  // 이 저자가 감수한 가이드
  const reviewedGuides = await db
    .select({
      id: guides.id,
      slug: guides.slug,
      title_ko: guides.title_ko,
      persona_group: guides.persona_group,
      published_at: guides.published_at,
    })
    .from(guides)
    .where(eq(guides.reviewer_id, author.id))

  // 이 저자가 작성한 비교 콘텐츠
  const authoredComparisons = await db
    .select({
      id: comparisons.id,
      slug: comparisons.slug,
      title_ko: comparisons.title_ko,
      published_at: comparisons.published_at,
    })
    .from(comparisons)
    .where(eq(comparisons.author_id, author.id))

  const credentials = parseCredentials(author.credentials_json)
  const today = new Date().toISOString().slice(0, 10)

  const PERSONA_LABEL: Record<string, string> = {
    family_caregiver: '가족 돌봄인',
    social_worker: '사회복지사',
    public_servant: '공무원',
    institution: '기관 담당자',
  }

  const jsonLdData = [
    buildArticleJsonLd({
      title: `${author.name} 저자 프로필`,
      description: author.bio_short ?? `${author.name}(${author.role})`,
      datePublished: today,
      dateModified: today,
      authorName: author.name,
      url: `${SITE_URL}/authors/${slug}`,
      imageUrl: author.avatar_url ?? undefined,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '저자', url: `${SITE_URL}/authors` },
      { name: author.name, url: `${SITE_URL}/authors/${slug}` },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* 브레드크럼 */}
        <nav className="text-xs text-gray-500" aria-label="breadcrumb">
          <ol className="flex items-center gap-1">
            <li><a href="/" className="hover:underline">홈</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/authors" className="hover:underline">저자</a></li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-800 font-medium">{author.name}</li>
          </ol>
        </nav>

        {/* 저자 프로필 헤더 */}
        <header className="flex items-start gap-5">
          {author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar_url}
              alt={`${author.name} 프로필 사진`}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
              {author.name.slice(0, 1)}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{author.name}</h1>
              <p className="text-sm text-gray-600 mt-0.5">{author.role}</p>
            </div>
            {credentials.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {credentials.map((cred, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {cred}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Bio */}
        {author.bio_short && (
          <section aria-label="소개">
            <h2 className="text-base font-semibold text-gray-900 mb-2">소개</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{author.bio_short}</p>
          </section>
        )}

        {/* 작성 콘텐츠 */}
        {authoredGuides.length > 0 && (
          <section aria-label="작성한 가이드">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              작성한 가이드 ({authoredGuides.length}편)
            </h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {authoredGuides.map((guide) => (
                <li key={guide.id} className="bg-white hover:bg-gray-50">
                  <a href={`/guide/${guide.slug}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{guide.title_ko}</span>
                      <span className="text-xs text-gray-500">
                        {PERSONA_LABEL[guide.persona_group] ?? guide.persona_group}
                        {guide.published_at &&
                          ` · ${new Date(guide.published_at).toLocaleDateString('ko-KR')}`}
                      </span>
                    </div>
                    <span className="text-blue-600 text-sm shrink-0">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 감수 콘텐츠 */}
        {reviewedGuides.length > 0 && (
          <section aria-label="감수한 가이드">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              감수한 가이드 ({reviewedGuides.length}편)
            </h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {reviewedGuides.map((guide) => (
                <li key={guide.id} className="bg-white hover:bg-gray-50">
                  <a href={`/guide/${guide.slug}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{guide.title_ko}</span>
                      <span className="text-xs text-gray-500">
                        {PERSONA_LABEL[guide.persona_group] ?? guide.persona_group}
                        {guide.published_at &&
                          ` · ${new Date(guide.published_at).toLocaleDateString('ko-KR')}`}
                      </span>
                    </div>
                    <span className="text-blue-600 text-sm shrink-0">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 제품 비교 콘텐츠 */}
        {authoredComparisons.length > 0 && (
          <section aria-label="작성한 제품 비교">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              작성한 제품 비교 ({authoredComparisons.length}편)
            </h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {authoredComparisons.map((comp) => (
                <li key={comp.id} className="bg-white hover:bg-gray-50">
                  <a href={`/compare/${comp.slug}`} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-gray-900">{comp.title_ko}</span>
                    <span className="text-blue-600 text-sm shrink-0">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 콘텐츠 없는 경우 */}
        {authoredGuides.length === 0 &&
          reviewedGuides.length === 0 &&
          authoredComparisons.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center border border-gray-200 rounded-lg bg-white">
              아직 게시된 콘텐츠가 없습니다.
            </p>
          )}

        {/* Sources */}
        <Sources
          sources={[
            {
              type: 'official',
              label: '돌봄지기 편집팀',
              url: SITE_URL,
            },
          ]}
        />
      </main>
    </>
  )
}
