import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { robots, comparisons, authors } from '@/db/schema'
import { SITE_URL } from '@/lib/config'

import JsonLdScript from '@/components/seo/JsonLdScript'
import AnswerBlock from '@/components/common/AnswerBlock'
import Sources from '@/components/common/Sources'
import AuthorBlock from '@/components/common/AuthorBlock'

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────
type Robot = typeof robots.$inferSelect
type Author = typeof authors.$inferSelect

// ─────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  companion: '반려·동행',
  senior_care: '노인돌봄',
  rehabilitation: '재활',
  monitoring: '모니터링',
}

function formatPrice(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    const rem = amount % 10000
    return rem > 0 ? `${man.toLocaleString()}만 ${rem.toLocaleString()}원` : `${man.toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

function parseJsonArray(json: string | null | undefined): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/** "a-vs-b" 슬러그에서 두 로봇 슬러그 추출 */
function parseSlugs(slug: string): { slugA: string; slugB: string } | null {
  const vsIndex = slug.lastIndexOf('-vs-')
  if (vsIndex === -1) return null
  return {
    slugA: slug.slice(0, vsIndex),
    slugB: slug.slice(vsIndex + 4),
  }
}

// ─────────────────────────────────────────
// 비교 차원
// ─────────────────────────────────────────
interface DiffRow {
  dimension: string
  valueA: string
  valueB: string
  winner?: 'a' | 'b' | 'tie'
}

function buildDiffRows(robotA: Robot, robotB: Robot): DiffRow[] {
  const rows: DiffRow[] = []

  // 카테고리
  rows.push({
    dimension: '카테고리',
    valueA: CATEGORY_LABEL[robotA.category] ?? robotA.category,
    valueB: CATEGORY_LABEL[robotB.category] ?? robotB.category,
    winner: robotA.category === robotB.category ? 'tie' : undefined,
  })

  // 제조사
  rows.push({
    dimension: '제조사',
    valueA: robotA.manufacturer,
    valueB: robotB.manufacturer,
  })

  // 제조국
  rows.push({
    dimension: '제조국',
    valueA: robotA.manufacturer_country,
    valueB: robotB.manufacturer_country,
  })

  // 최저가
  if (robotA.price_min || robotB.price_min) {
    const aVal = robotA.price_min ? formatPrice(robotA.price_min) : '정보 없음'
    const bVal = robotB.price_min ? formatPrice(robotB.price_min) : '정보 없음'
    let winner: 'a' | 'b' | 'tie' | undefined
    if (robotA.price_min && robotB.price_min) {
      winner = robotA.price_min < robotB.price_min ? 'a' : robotA.price_min > robotB.price_min ? 'b' : 'tie'
    }
    rows.push({ dimension: '최저 구매가', valueA: aVal, valueB: bVal, winner })
  }

  // 최고가
  if (robotA.price_max || robotB.price_max) {
    const aVal = robotA.price_max ? formatPrice(robotA.price_max) : '정보 없음'
    const bVal = robotB.price_max ? formatPrice(robotB.price_max) : '정보 없음'
    rows.push({ dimension: '최고 구매가', valueA: aVal, valueB: bVal })
  }

  // 월 구독
  rows.push({
    dimension: '월 구독',
    valueA: robotA.subscription_monthly ? `${formatPrice(robotA.subscription_monthly)}/월` : '미지원',
    valueB: robotB.subscription_monthly ? `${formatPrice(robotB.subscription_monthly)}/월` : '미지원',
  })

  // 대여 가능
  rows.push({
    dimension: '대여 가능 여부',
    valueA: robotA.rental_available ? '가능' : '불가',
    valueB: robotB.rental_available ? '가능' : '불가',
    winner:
      robotA.rental_available && !robotB.rental_available
        ? 'a'
        : !robotA.rental_available && robotB.rental_available
        ? 'b'
        : 'tie',
  })

  // 출시 연도
  if (robotA.release_year || robotB.release_year) {
    rows.push({
      dimension: '출시 연도',
      valueA: robotA.release_year ? `${robotA.release_year}년` : '정보 없음',
      valueB: robotB.release_year ? `${robotB.release_year}년` : '정보 없음',
    })
  }

  // 한국 시장
  rows.push({
    dimension: '국내 판매',
    valueA: robotA.korea_market ? '판매 중' : '미출시',
    valueB: robotB.korea_market ? '판매 중' : '미출시',
    winner:
      robotA.korea_market && !robotB.korea_market
        ? 'a'
        : !robotA.korea_market && robotB.korea_market
        ? 'b'
        : 'tie',
  })

  return rows
}

// ─────────────────────────────────────────
// generateStaticParams
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: comparisons.slug }).from(comparisons)
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// generateMetadata
// ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlugs(slug)
  if (!parsed) return { title: '비교 페이지' }

  const [robotA] = await db
    .select({ name_ko: robots.name_ko })
    .from(robots)
    .where(eq(robots.slug, parsed.slugA))
    .limit(1)

  const [robotB] = await db
    .select({ name_ko: robots.name_ko })
    .from(robots)
    .where(eq(robots.slug, parsed.slugB))
    .limit(1)

  if (!robotA || !robotB) return { title: '비교 페이지' }

  const title = `${robotA.name_ko} vs ${robotB.name_ko} 비교 | 가격·기능·지원 총정리`
  const description = `${robotA.name_ko}와 ${robotB.name_ko}를 가격, 주요 기능, 지자체 지원 현황 기준으로 상세 비교합니다. 내 상황에 맞는 돌봄 로봇을 선택하세요.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: `${SITE_URL}/compare/${slug}`,
    },
  }
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function CompareDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const parsed = parseSlugs(slug)
  if (!parsed) notFound()

  const { slugA, slugB } = parsed

  // 두 로봇 조회
  const [robotA] = await db.select().from(robots).where(eq(robots.slug, slugA)).limit(1)
  const [robotB] = await db.select().from(robots).where(eq(robots.slug, slugB)).limit(1)

  if (!robotA || !robotB) notFound()

  // DB에서 비교 메타 조회 (있으면 활용)
  const [comparison] = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.slug, slug))
    .limit(1)

  // 작성자 조회 (비교 데이터가 있을 경우)
  let authorData: Author | undefined
  let reviewerData: Author | undefined
  if (comparison?.author_id) {
    const [a] = await db.select().from(authors).where(eq(authors.id, comparison.author_id)).limit(1)
    authorData = a
  }
  if (comparison?.reviewer_id) {
    const [r] = await db.select().from(authors).where(eq(authors.id, comparison.reviewer_id)).limit(1)
    reviewerData = r
  }

  const diffRows = buildDiffRows(robotA, robotB)
  const prosA = comparison ? parseJsonArray(comparison.pros_a_json) : []
  const prosB = comparison ? parseJsonArray(comparison.pros_b_json) : []

  // 페르소나 추천 (비교 데이터 활용 또는 기본값)
  const recommendedPersona = comparison?.recommended_persona

  // JSON-LD: ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${robotA.name_ko} vs ${robotB.name_ko} 비교`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: robotA.name_ko,
        url: `${SITE_URL}/robot/${robotA.slug}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: robotB.name_ko,
        url: `${SITE_URL}/robot/${robotB.slug}/`,
      },
    ],
  }

  const todayDate = new Date()
  const today = todayDate.toISOString().split('T')[0]
  const nextUpdate = new Date(todayDate.getTime() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return (
    <>
      <JsonLdScript data={itemListJsonLd} />

      {/* 히어로 */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-700">홈</Link>
            {' > '}
            <Link href="/compare/" className="hover:text-gray-700">로봇 비교</Link>
            {' > '}
            <span className="text-gray-600">{robotA.name_ko} vs {robotB.name_ko}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {robotA.name_ko}
            <span className="mx-3 text-blue-400 font-light">vs</span>
            {robotB.name_ko}
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            {CATEGORY_LABEL[robotA.category] ?? robotA.category} · {CATEGORY_LABEL[robotB.category] ?? robotB.category} 비교
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-12">
        {/* 핵심 답변 */}
        <AnswerBlock>
          {comparison?.summary ??
            `${robotA.name_ko}와 ${robotB.name_ko}는 각각 ${CATEGORY_LABEL[robotA.category] ?? robotA.category}와 ${CATEGORY_LABEL[robotB.category] ?? robotB.category} 제품입니다. 가격, 기능, 지원 현황을 비교하여 상황에 맞는 로봇을 선택하세요.`}
        </AnswerBlock>

        {/* 한 줄 결론 */}
        {recommendedPersona && (
          <section aria-label="추천 결론">
            <h2 className="text-xl font-bold text-gray-900 mb-3">한 줄 결론</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-gray-800">
              {recommendedPersona}
            </div>
          </section>
        )}

        {/* 핵심 차이 표 */}
        <section aria-label="핵심 비교 표">
          <h2 className="text-xl font-bold text-gray-900 mb-4">핵심 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold w-1/4">비교 항목</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-700 w-[37.5%]">
                    {robotA.name_ko}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-700 w-[37.5%]">
                    {robotB.name_ko}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diffRows.map((row, index) => (
                  <tr key={index} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-medium">{row.dimension}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        row.winner === 'a' ? 'text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      {row.valueA}
                      {row.winner === 'a' && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                          유리
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        row.winner === 'b' ? 'text-indigo-700' : 'text-gray-900'
                      }`}
                    >
                      {row.valueB}
                      {row.winner === 'b' && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5">
                          유리
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 장점 비교 (DB 데이터가 있을 때) */}
        {(prosA.length > 0 || prosB.length > 0) && (
          <section aria-label="장점 비교">
            <h2 className="text-xl font-bold text-gray-900 mb-4">각 제품의 장점</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prosA.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
                  <h3 className="font-bold text-blue-800 mb-3 text-sm">{robotA.name_ko} 장점</h3>
                  <ul className="flex flex-col gap-2">
                    {prosA.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {prosB.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
                  <h3 className="font-bold text-indigo-800 mb-3 text-sm">{robotB.name_ko} 장점</h3>
                  <ul className="flex flex-col gap-2">
                    {prosB.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500 mt-0.5">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 가격 비교 카드 */}
        <section aria-label="가격 비교">
          <h2 className="text-xl font-bold text-gray-900 mb-4">가격 비교</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { robot: robotA, color: 'blue' },
              { robot: robotB, color: 'indigo' },
            ].map(({ robot, color }) => (
              <div
                key={robot.slug}
                className={`bg-white border border-${color}-100 rounded-xl px-5 py-5 flex flex-col gap-2`}
              >
                <h3 className={`font-bold text-${color}-800 text-sm`}>{robot.name_ko}</h3>
                {robot.price_min || robot.price_max ? (
                  <p className="text-lg font-bold text-gray-900">
                    {robot.price_min && robot.price_max
                      ? `${formatPrice(robot.price_min)} ~ ${formatPrice(robot.price_max)}`
                      : robot.price_min
                      ? `${formatPrice(robot.price_min)} ~`
                      : robot.price_max
                      ? `~ ${formatPrice(robot.price_max)}`
                      : ''}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">가격 정보 없음</p>
                )}
                {robot.subscription_monthly && (
                  <p className="text-sm text-gray-600">
                    월 구독: <span className="font-semibold">{formatPrice(robot.subscription_monthly)}/월</span>
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  대여: {robot.rental_available ? '가능' : '불가'}
                </p>
                <Link
                  href={`/robot/${robot.slug}/`}
                  className={`mt-2 text-xs text-${color}-600 hover:underline`}
                >
                  {robot.name_ko} 상세 보기 →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 페르소나별 추천 */}
        <section aria-label="페르소나별 추천">
          <h2 className="text-xl font-bold text-gray-900 mb-4">이런 분께 추천합니다</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
              <h3 className="font-bold text-blue-800 mb-2 text-sm">
                {robotA.name_ko}가 적합한 경우
              </h3>
              <ul className="flex flex-col gap-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  예산이 한정되어 있고 {CATEGORY_LABEL[robotA.category] ?? robotA.category} 기능을 우선시할 때
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">→</span>
                  국내 A/S와 지원을 중요시할 때 (국내 제조사: {robotA.manufacturer_country === '대한민국' ? '✓' : 'x'})
                </li>
                {robotA.rental_available && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">→</span>
                    대여로 먼저 체험해보고 싶을 때
                  </li>
                )}
              </ul>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
              <h3 className="font-bold text-indigo-800 mb-2 text-sm">
                {robotB.name_ko}가 적합한 경우
              </h3>
              <ul className="flex flex-col gap-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">→</span>
                  {CATEGORY_LABEL[robotB.category] ?? robotB.category} 기능에 특화된 솔루션이 필요할 때
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">→</span>
                  국내 A/S와 지원을 중요시할 때 (국내 제조사: {robotB.manufacturer_country === '대한민국' ? '✓' : 'x'})
                </li>
                {robotB.subscription_monthly && (
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400">→</span>
                    초기 비용 없이 월정액으로 이용하고 싶을 때
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* 출처 */}
        <Sources
          sources={[
            {
              type: 'official',
              label: `${robotA.manufacturer} 공식 홈페이지`,
              url: robotA.manufacturer_url ?? undefined,
            },
            {
              type: 'official',
              label: `${robotB.manufacturer} 공식 홈페이지`,
              url: robotB.manufacturer_url ?? undefined,
            },
            {
              type: 'government',
              label: '보건복지부 돌봄로봇 보급사업',
              url: 'https://www.mohw.go.kr',
            },
          ]}
        />

        {/* 작성자 */}
        <AuthorBlock
          author={
            authorData
              ? {
                  name: authorData.name,
                  role: authorData.role,
                  slug: authorData.slug,
                }
              : {
                  name: '돌봄지기 편집팀',
                  role: '돌봄로봇 전문 에디터',
                  slug: 'editorial-team',
                }
          }
          reviewer={
            reviewerData
              ? {
                  name: reviewerData.name,
                  credentials: reviewerData.role,
                  slug: reviewerData.slug,
                }
              : undefined
          }
          confirmedAt={today}
          nextUpdateAt={nextUpdate}
        />
      </div>
    </>
  )
}
