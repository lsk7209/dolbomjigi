import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { researchStudies, robots } from '@/db/schema'
import { eq } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: researchStudies.slug }).from(researchStudies)
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
  const study = await db
    .select()
    .from(researchStudies)
    .where(eq(researchStudies.slug, slug))
    .get()

  if (!study) return { title: '연구를 찾을 수 없습니다' }

  const title = `${study.title} | 돌봄로봇 연구`
  const description =
    study.summary_ko ??
    `${study.authors_list}의 연구. ${study.journal ?? ''} (${study.year ?? ''}).`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_URL}/research/${slug}`,
    },
  }
}

// ─────────────────────────────────────────
// ScholarlyArticle JSON-LD 생성
// ─────────────────────────────────────────
function buildScholarlyArticleJsonLd(study: {
  title: string
  authors_list: string
  journal: string | null
  year: number | null
  doi: string | null
  url: string | null
  summary_ko: string | null
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: study.title,
    author: study.authors_list.split(/[,;]/).map((name) => ({
      '@type': 'Person',
      name: name.trim(),
    })),
  }
  if (study.journal) ld['isPartOf'] = { '@type': 'Periodical', name: study.journal }
  if (study.year) ld['datePublished'] = String(study.year)
  if (study.doi) ld['identifier'] = { '@type': 'PropertyValue', propertyID: 'DOI', value: study.doi }
  if (study.url) ld['url'] = study.url
  if (study.summary_ko) ld['abstract'] = study.summary_ko
  return ld
}

// ─────────────────────────────────────────
// 인용된 로봇 파싱
// ─────────────────────────────────────────
async function getCitedRobots(citedJson: string | null) {
  if (!citedJson) return []
  try {
    const ids: number[] = JSON.parse(citedJson)
    if (!Array.isArray(ids) || ids.length === 0) return []
    const allRobots = await db
      .select({ id: robots.id, slug: robots.slug, name_ko: robots.name_ko, manufacturer: robots.manufacturer })
      .from(robots)
    return allRobots.filter((r) => ids.includes(r.id))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function ResearchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const study = await db
    .select()
    .from(researchStudies)
    .where(eq(researchStudies.slug, slug))
    .get()

  if (!study) notFound()

  const citedRobots = await getCitedRobots(study.cited_robots_json)

  const jsonLdData = [
    buildScholarlyArticleJsonLd(study),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '연구', url: `${SITE_URL}/research` },
      { name: study.title, url: `${SITE_URL}/research/${slug}` },
    ]),
  ]

  // 저자 목록 파싱
  const authorsList = study.authors_list
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* 브레드크럼 */}
        <nav className="text-xs text-gray-500" aria-label="breadcrumb">
          <ol className="flex items-center gap-1 flex-wrap">
            <li><a href="/" className="hover:underline">홈</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/research" className="hover:underline">연구</a></li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-800 font-medium line-clamp-1">{study.title}</li>
          </ol>
        </nav>

        {/* 1. 원문 정보 */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800">
              학술 연구
            </span>
            {study.year && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                {study.year}년
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {study.title}
          </h1>

          <dl className="flex flex-col gap-1 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
            <div className="flex gap-2">
              <dt className="font-semibold text-gray-600 shrink-0 w-16">저자</dt>
              <dd className="flex flex-wrap gap-1">
                {authorsList.map((author, idx) => (
                  <span key={idx} className="text-gray-800">
                    {author}{idx < authorsList.length - 1 ? ',' : ''}
                  </span>
                ))}
              </dd>
            </div>
            {study.journal && (
              <div className="flex gap-2">
                <dt className="font-semibold text-gray-600 shrink-0 w-16">저널</dt>
                <dd className="text-gray-800">{study.journal}</dd>
              </div>
            )}
            {study.year && (
              <div className="flex gap-2">
                <dt className="font-semibold text-gray-600 shrink-0 w-16">연도</dt>
                <dd className="text-gray-800">{study.year}</dd>
              </div>
            )}
            {study.doi && (
              <div className="flex gap-2">
                <dt className="font-semibold text-gray-600 shrink-0 w-16">DOI</dt>
                <dd>
                  <a
                    href={`https://doi.org/${study.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {study.doi}
                  </a>
                </dd>
              </div>
            )}
            {study.url && !study.doi && (
              <div className="flex gap-2">
                <dt className="font-semibold text-gray-600 shrink-0 w-16">링크</dt>
                <dd>
                  <a
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    원문 보기
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </header>

        {/* 2. AnswerBlock: 연구 핵심 결과 250자 */}
        <AnswerBlock>
          {study.summary_ko
            ? study.summary_ko.slice(0, 250)
            : `${study.title} 연구의 핵심 내용을 확인하세요.`}
        </AnswerBlock>

        {/* 3. 연구 상세 */}
        <section className="flex flex-col gap-6">
          {/* 연구 배경 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">연구 배경</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 연구는 돌봄로봇이 노인 케어 현장에서 미치는 영향을 분석하고,
              정책적·실용적 시사점을 도출하기 위해 수행되었습니다.
              {study.journal && ` ${study.journal}에 게재된 논문입니다.`}
            </p>
          </div>

          {/* 핵심 결과 */}
          {study.summary_ko && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">핵심 결과</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{study.summary_ko}</p>
            </div>
          )}

          {/* 본 사이트의 해석 */}
          <div className="border-l-4 border-indigo-400 bg-indigo-50 px-5 py-4 rounded-r-md">
            <h2 className="text-base font-semibold text-indigo-900 mb-1">
              돌봄지기의 해석
            </h2>
            <p className="text-sm text-indigo-800 leading-relaxed">
              이 연구 결과는 한국의 돌봄로봇 보급 정책 수립 및 현장 적용에 참고할 수 있습니다.
              구체적인 제품 선택이나 도입 결정 시 전문가 상담을 권장합니다.
            </p>
          </div>

          {/* 시사점 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">시사점</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
              <li>돌봄로봇 도입 전 현장 환경 및 수혜자 특성 분석이 중요합니다.</li>
              <li>적절한 교육과 지원 체계를 갖춰야 효과를 극대화할 수 있습니다.</li>
              <li>지속적인 모니터링과 피드백 수집이 필요합니다.</li>
            </ul>
          </div>
        </section>

        {/* 인용 로봇 */}
        {citedRobots.length > 0 && (
          <section aria-label="연구에서 언급된 제품">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              연구에서 언급된 제품
            </h2>
            <ul className="flex flex-wrap gap-2">
              {citedRobots.map((robot) => (
                <li key={robot.id}>
                  <a
                    href={`/robot/${robot.slug}`}
                    className="inline-block border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {robot.name_ko}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 4. 출처 및 인용 표기 */}
        <section
          aria-label="출처 및 인용 표기"
          className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-50"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-2">인용 표기</h2>
          <p className="text-xs text-gray-600 font-mono leading-relaxed break-all">
            {authorsList.join(', ')}.{' '}
            {study.year && `(${study.year}). `}
            {study.title}.{' '}
            {study.journal && `${study.journal}. `}
            {study.doi && `https://doi.org/${study.doi}`}
            {!study.doi && study.url && study.url}
          </p>
        </section>

        {/* Sources */}
        <Sources
          sources={[
            ...(study.doi
              ? [
                  {
                    type: 'research' as const,
                    label: study.title,
                    url: `https://doi.org/${study.doi}`,
                    date: study.year ? String(study.year) : undefined,
                  },
                ]
              : study.url
                ? [
                    {
                      type: 'research' as const,
                      label: study.title,
                      url: study.url,
                      date: study.year ? String(study.year) : undefined,
                    },
                  ]
                : []),
          ]}
        />
      </main>
    </>
  )
}
