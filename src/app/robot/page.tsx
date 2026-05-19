import type { Metadata } from 'next'
import { db } from '@/db/client'
import { robots } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄 로봇 제품 목록 — 돌봄지기',
  description:
    '말벗·돌봄 보조·재활·모니터링 카테고리별 돌봄로봇 전체 제품을 비교하고 상세 정보를 확인하세요. 가격, 제조사, 구독료 정보 포함.',
  openGraph: {
    title: '돌봄 로봇 제품 목록 — 돌봄지기',
    description: '카테고리별 돌봄로봇 전체 제품 목록. 가격·제조사·기능 한눈에 비교.',
    url: 'https://dolbomjigi.com/robot',
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: 'https://dolbomjigi.com/robot' },
}

const CATEGORY_LABEL: Record<string, string> = {
  companion: '말벗·반려 로봇',
  senior_care: '돌봄 보조',
  rehabilitation: '재활',
  monitoring: '모니터링',
}

const CATEGORY_COLOR: Record<string, string> = {
  companion: 'bg-purple-100 text-purple-800',
  senior_care: 'bg-blue-100 text-blue-800',
  rehabilitation: 'bg-green-100 text-green-800',
  monitoring: 'bg-orange-100 text-orange-800',
}

const CATEGORIES = ['companion', 'senior_care', 'rehabilitation', 'monitoring'] as const

export default async function RobotListPage() {
  const allRobots = await db
    .select({
      id: robots.id,
      slug: robots.slug,
      name_ko: robots.name_ko,
      manufacturer: robots.manufacturer,
      category: robots.category,
      korea_market: robots.korea_market,
      price_min: robots.price_min,
      subscription_monthly: robots.subscription_monthly,
      rental_available: robots.rental_available,
      description_short: robots.description_short,
    })
    .from(robots)
    .orderBy(desc(robots.korea_market), robots.name_ko)
    .catch(() => [] as typeof robots.$inferSelect[])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 제품 목록</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 전체 목록
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            말벗·돌봄 보조·재활·모니터링 카테고리의 돌봄로봇 제품을 한곳에서 비교하세요.
            가격, 제조사, 구독·렌탈 옵션을 확인하고 어르신에게 맞는 제품을 찾아보세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-8">

        {/* ── 카테고리 탭 ── */}
        <nav aria-label="카테고리 필터" className="flex flex-wrap gap-2">
          <a
            href="/robot"
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-gray-900 text-white"
          >
            전체
          </a>
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/robot?category=${cat}`}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              {CATEGORY_LABEL[cat]}
            </a>
          ))}
        </nav>

        {/* ── 제품 그리드 ── */}
        {allRobots.length === 0 ? (
          <p className="text-sm text-gray-500 py-16 text-center border border-gray-200 rounded-xl bg-white">
            등록된 제품이 없습니다.
          </p>
        ) : (
          <section aria-label="로봇 제품 목록">
            <p className="text-xs text-gray-500 mb-4">총 {allRobots.length}개 제품</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allRobots.map((robot) => (
                <a
                  key={robot.id}
                  href={`/robot/${robot.slug}`}
                  className="flex flex-col gap-2 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-900 leading-snug">
                        {robot.name_ko}
                      </span>
                      <span className="text-xs text-gray-500">{robot.manufacturer}</span>
                    </div>
                    <span
                      className={`inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[robot.category] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {CATEGORY_LABEL[robot.category] ?? robot.category}
                    </span>
                  </div>

                  {robot.description_short && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {robot.description_short}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 text-xs text-gray-600">
                    {robot.price_min && (
                      <span className="font-medium text-gray-800">
                        구매 {(robot.price_min / 10000).toFixed(0)}만원~
                      </span>
                    )}
                    {robot.subscription_monthly && (
                      <span>월정액 {(robot.subscription_monthly / 10000).toFixed(0)}만원~</span>
                    )}
                    {robot.rental_available && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-green-100 text-green-800">
                        렌탈 가능
                      </span>
                    )}
                    {robot.korea_market && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-blue-50 text-blue-700">
                        국내 출시
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── 하단 안내 ── */}
        <div className="border border-gray-200 rounded-xl bg-white px-5 py-5 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">제품 정보 안내</p>
          <p>
            가격·구독료는 제조사 공시 기준이며 실제 구매 시 변동될 수 있습니다.
            정확한 정보는 각 제조사 또는 판매처에 직접 문의하세요.
          </p>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <a href="/" className="hover:text-gray-800">홈</a>
          <a href="/compare" className="hover:text-gray-800">제품 비교</a>
          <a href="/support" className="hover:text-gray-800">지원사업</a>
          <a href="/guide" className="hover:text-gray-800">이용 가이드</a>
        </footer>
      </div>
    </div>
  )
}
