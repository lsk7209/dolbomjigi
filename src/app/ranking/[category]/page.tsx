import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { eq, asc, desc } from 'drizzle-orm'
import Link from 'next/link'

import { db } from '@/db/client'
import { robots } from '@/db/schema'
import JsonLdScript from '@/components/seo/JsonLdScript'

// ─────────────────────────────────────────
// 카테고리 설정
// ─────────────────────────────────────────
interface CategoryConfig {
  label: string
  description: string
  sortFn: (a: RobotRow, b: RobotRow) => number
}

type RobotRow = typeof robots.$inferSelect

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'best-value': {
    label: '가성비 최고',
    description: '국내 판매 돌봄 로봇 중 가격 대비 기능이 뛰어난 제품을 순위별로 정리했습니다.',
    sortFn: (a, b) => {
      const aPrice = a.price_min ?? a.price_max ?? Infinity
      const bPrice = b.price_min ?? b.price_max ?? Infinity
      return aPrice - bPrice
    },
  },
  'senior-friendly': {
    label: '어르신 친화',
    description: '독거 어르신, 경증 인지저하 노인 등 시니어 사용자에게 특히 적합한 돌봄 로봇 순위입니다.',
    sortFn: (a, b) => {
      const score = (r: RobotRow) =>
        (r.category === 'companion' || r.category === 'senior_care' ? 2 : 0) +
        (r.rental_available ? 1 : 0) +
        (r.subscription_monthly ? 1 : 0)
      return score(b) - score(a)
    },
  },
  'government-supported': {
    label: '정부·지자체 지원',
    description: '지자체 보조금·무상 보급 지원사업을 통해 저렴하게 이용 가능한 돌봄 로봇 순위입니다.',
    sortFn: (a, b) => {
      const score = (r: RobotRow) =>
        (r.rental_available ? 2 : 0) +
        (r.korea_market ? 1 : 0)
      return score(b) - score(a)
    },
  },
  'companion': {
    label: '반려·동행 로봇',
    description: '어르신의 대화 상대·감정 교류·일상 동행 역할을 하는 반려형 돌봄 로봇 순위입니다.',
    sortFn: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
  },
  'senior-care': {
    label: '노인돌봄 로봇',
    description: '노인 일상 돌봄, 건강 모니터링, 약 복용 알림 등 전문 돌봄 기능이 강한 로봇 순위입니다.',
    sortFn: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
  },
  'rehabilitation': {
    label: '재활 로봇',
    description: '뇌졸중 회복, 보행 훈련, 관절 재활 등 재활의학 분야에 활용되는 로봇 순위입니다.',
    sortFn: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
  },
  'monitoring': {
    label: '모니터링 로봇',
    description: '독거 어르신 안전 확인, 낙상 감지, 원격 모니터링 기능 중심의 로봇 순위입니다.',
    sortFn: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
  },
}

// ─────────────────────────────────────────
// DB 카테고리 매핑 (URL slug → DB enum)
// ─────────────────────────────────────────
const CATEGORY_DB_MAP: Record<string, string | null> = {
  'best-value': null,
  'senior-friendly': null,
  'government-supported': null,
  'companion': 'companion',
  'senior-care': 'senior_care',
  'rehabilitation': 'rehabilitation',
  'monitoring': 'monitoring',
}

function formatPrice(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    return `${man.toLocaleString()}만원~`
  }
  return `${amount.toLocaleString()}원~`
}

// ─────────────────────────────────────────
// generateStaticParams
// ─────────────────────────────────────────
export async function generateStaticParams() {
  // 카테고리 목록은 정적이므로 DB 없이 반환
  return Object.keys(CATEGORY_CONFIGS).map((category) => ({ category }))
}

// ─────────────────────────────────────────
// generateMetadata
// ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const config = CATEGORY_CONFIGS[category]
  if (!config) return { title: '랭킹' }

  const title = `${config.label} 돌봄 로봇 순위 | 2026년 최신`
  return {
    title,
    description: config.description,
    openGraph: { title, description: config.description },
  }
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function RankingCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const config = CATEGORY_CONFIGS[category]
  if (!config) notFound()

  // DB 조회: korea_market=true 로봇 목록
  const dbCategory = CATEGORY_DB_MAP[category]

  let allRobots: RobotRow[]
  if (dbCategory) {
    allRobots = await db
      .select()
      .from(robots)
      .where(eq(robots.category, dbCategory as 'companion' | 'senior_care' | 'rehabilitation' | 'monitoring'))
      .catch(() => [] as RobotRow[])
  } else {
    allRobots = await db
      .select()
      .from(robots)
      .where(eq(robots.korea_market, true))
      .catch(() => [] as RobotRow[])
  }

  // 정렬
  const sorted = [...allRobots].sort(config.sortFn)

  // JSON-LD: ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${config.label} 돌봄 로봇 순위`,
    description: config.description,
    itemListElement: sorted.slice(0, 10).map((robot, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: robot.name_ko,
      url: `https://dolbomjigi.com/robot/${robot.slug}/`,
    })),
  }

  const CATEGORY_BADGE: Record<string, string> = {
    companion: '반려·동행',
    senior_care: '노인돌봄',
    rehabilitation: '재활',
    monitoring: '모니터링',
  }

  return (
    <>
      <JsonLdScript data={itemListJsonLd} />

      {/* 헤더 */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-gray-700">홈</a>
            {' > '}
            <a href="/ranking/" className="hover:text-gray-700">랭킹</a>
            {' > '}
            <span className="text-gray-600">{config.label}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            {config.label} 돌봄 로봇 순위
          </h1>
          <p className="mt-2 text-sm text-gray-500">{config.description}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">해당 카테고리에 등록된 로봇이 없습니다.</p>
            <p className="text-sm mt-2">
              <a href="/robot/" className="text-blue-600 hover:underline">전체 로봇 목록 보기</a>
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {sorted.map((robot, index) => (
              <li key={robot.id}>
                <Link
                  href={`/robot/${robot.slug}/`}
                  className="flex items-center gap-5 bg-white border border-gray-100 rounded-2xl px-5 py-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
                >
                  {/* 순위 */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-400 text-white'
                        : index === 1
                        ? 'bg-gray-300 text-white'
                        : index === 2
                        ? 'bg-orange-300 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-base">{robot.name_ko}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        {CATEGORY_BADGE[robot.category] ?? robot.category}
                      </span>
                      {robot.korea_market && (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                          국내 판매
                        </span>
                      )}
                      {robot.rental_available && (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                          대여 가능
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{robot.manufacturer}</p>
                    {robot.description_short && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{robot.description_short}</p>
                    )}
                  </div>

                  {/* 가격 */}
                  <div className="flex-shrink-0 text-right">
                    {robot.price_min ? (
                      <p className="text-sm font-bold text-gray-900">{formatPrice(robot.price_min)}</p>
                    ) : robot.subscription_monthly ? (
                      <p className="text-sm font-bold text-blue-700">
                        {Math.floor(robot.subscription_monthly / 10000)}만원/월
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">가격 문의</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">자세히 보기 →</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {/* 다른 카테고리 */}
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">다른 카테고리 순위</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_CONFIGS)
              .filter(([key]) => key !== category)
              .map(([key, cfg]) => (
                <Link
                  key={key}
                  href={`/ranking/${key}/`}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {cfg.label}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  )
}
