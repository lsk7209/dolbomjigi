import type { Metadata } from 'next'
import { db } from '@/db/client'
import { robots, supportPrograms, regions } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄지기 — 어르신 돌봄로봇 정보·신청·도입 가이드',
  description:
    '어르신 돌봄로봇 제품 정보, 지자체 지원사업 신청 안내, 기관 도입 가이드를 한곳에서 확인하세요. 공공누리 데이터 기반 신뢰 정보.',
  openGraph: {
    title: '돌봄지기 — 어르신 돌봄로봇 정보·신청·도입 가이드',
    description:
      '어르신 돌봄로봇 제품 정보, 지자체 지원사업 신청 안내, 기관 도입 가이드를 한곳에서 확인하세요.',
    url: 'https://dolbomjigi.com',
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: {
    canonical: 'https://dolbomjigi.com',
  },
}

// ─────────────────────────────────────────
// 카테고리 한글
// ─────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  companion: '말벗·반려 로봇',
  senior_care: '돌봄 보조',
  rehabilitation: '재활',
  monitoring: '모니터링',
}

// ─────────────────────────────────────────
// 프로그램 유형 한글
// ─────────────────────────────────────────
const PROGRAM_TYPE_LABEL: Record<string, string> = {
  free_distribution: '무상 보급',
  rental: '렌탈',
  subsidy: '보조금',
  rd_grant: 'R&D 지원',
}

// ─────────────────────────────────────────
// 홈페이지 (정적 + ISR)
// ─────────────────────────────────────────
export default async function HomePage() {
  // 최신 로봇 8개
  const latestRobots = await db
    .select({
      id: robots.id,
      slug: robots.slug,
      name_ko: robots.name_ko,
      manufacturer: robots.manufacturer,
      category: robots.category,
      price_min: robots.price_min,
      price_max: robots.price_max,
      subscription_monthly: robots.subscription_monthly,
      rental_available: robots.rental_available,
      hero_image_url: robots.hero_image_url,
      description_short: robots.description_short,
    })
    .from(robots)
    .orderBy(desc(robots.created_at))
    .limit(8)
    .catch(() => [] as typeof robots.$inferSelect[])

  // 최신 지원사업 5개 (human_reviewed=true)
  const latestPrograms = await db
    .select({
      id: supportPrograms.id,
      slug: supportPrograms.slug,
      name_ko: supportPrograms.name_ko,
      program_type: supportPrograms.program_type,
      status: supportPrograms.status,
      region_id: supportPrograms.region_id,
      period_end: supportPrograms.period_end,
    })
    .from(supportPrograms)
    .where(eq(supportPrograms.human_reviewed, true))
    .orderBy(desc(supportPrograms.id))
    .limit(5)
    .catch(() => [] as Array<{
      id: number
      slug: string
      name_ko: string
      program_type: 'free_distribution' | 'rental' | 'subsidy' | 'rd_grant'
      status: 'active' | 'closed' | 'unknown'
      region_id: number | null
      period_end: Date | null
    }>)

  // 지역 정보 (프로그램용)
  const regionIds = latestPrograms
    .map((p) => p.region_id)
    .filter((id): id is number => id !== null)

  const regionMap = new Map<number, { slug: string; sido_name: string; sigungu_name: string | null }>()
  if (regionIds.length > 0) {
    const allRegions = await db.select().from(regions).catch(() => [])
    allRegions.forEach((r) => regionMap.set(r.id, r))
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-16 flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
            공공누리 데이터 기반 · 전문가 검증
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            어르신 돌봄로봇<br />
            정보·신청·도입 가이드
          </h1>
          <p className="max-w-lg text-base text-gray-600 leading-relaxed">
            돌봄로봇 제품 비교부터 지자체 보급사업 신청, 요양원·복지관 도입까지
            필요한 모든 정보를 한곳에서 확인하세요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <a
              href="/robot"
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-700"
            >
              제품 목록 보기
            </a>
            <a
              href="/support"
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white text-gray-800 px-5 py-2.5 text-sm font-medium hover:bg-gray-100"
            >
              지원사업 찾기
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-12 w-full">

        {/* ── 주요 카테고리 ── */}
        <section aria-label="주요 카테고리">
          <h2 className="text-xl font-bold text-gray-900 mb-4">무엇을 찾으시나요?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/robot"
              className="flex flex-col gap-2 border border-gray-200 rounded-xl px-5 py-5 bg-white hover:shadow-md hover:border-blue-300 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">🤖</span>
              <span className="text-base font-semibold text-gray-900">돌봄로봇 제품</span>
              <span className="text-sm text-gray-500">말벗·돌봄·재활·모니터링 제품 비교</span>
            </a>
            <a
              href="/support"
              className="flex flex-col gap-2 border border-gray-200 rounded-xl px-5 py-5 bg-white hover:shadow-md hover:border-green-300 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">📋</span>
              <span className="text-base font-semibold text-gray-900">지원사업 찾기</span>
              <span className="text-sm text-gray-500">지역별 무상보급·렌탈·보조금 안내</span>
            </a>
            <a
              href="/guide"
              className="flex flex-col gap-2 border border-gray-200 rounded-xl px-5 py-5 bg-white hover:shadow-md hover:border-purple-300 transition-all"
            >
              <span className="text-2xl" aria-hidden="true">📖</span>
              <span className="text-base font-semibold text-gray-900">이용 가이드</span>
              <span className="text-sm text-gray-500">선택 방법·신청 절차·도입 가이드</span>
            </a>
          </div>
        </section>

        {/* ── 최신 로봇 제품 ── */}
        <section aria-label="최신 돌봄로봇 제품">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">최신 돌봄로봇</h2>
            <a href="/robot" className="text-sm text-blue-600 hover:underline">
              전체 보기 &rarr;
            </a>
          </div>

          {latestRobots.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center border border-gray-200 rounded-xl bg-white">
              등록된 제품이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latestRobots.map((robot) => (
                <a
                  key={robot.id}
                  href={`/robot/${robot.slug}`}
                  className="flex flex-col gap-2 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all overflow-hidden"
                >
                  {robot.hero_image_url && (
                    <div className="w-full h-36 bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={robot.hero_image_url}
                        alt={robot.name_ko}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {robot.name_ko}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-800">
                        {CATEGORY_LABEL[robot.category] ?? robot.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{robot.manufacturer}</span>
                    {robot.description_short && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                        {robot.description_short}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      {robot.price_min && (
                        <span>
                          구매 {(robot.price_min / 10000).toFixed(0)}만원~
                        </span>
                      )}
                      {robot.subscription_monthly && (
                        <span>
                          월정액 {(robot.subscription_monthly / 10000).toFixed(0)}만원~
                        </span>
                      )}
                      {robot.rental_available && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-green-100 text-green-800">
                          렌탈 가능
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ── 최신 지원사업 ── */}
        <section aria-label="최신 돌봄로봇 지원사업">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">최신 지원사업</h2>
            <a href="/support" className="text-sm text-blue-600 hover:underline">
              전체 보기 &rarr;
            </a>
          </div>

          {latestPrograms.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center border border-gray-200 rounded-xl bg-white">
              현재 진행중인 검증된 지원사업이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {latestPrograms.map((prog) => {
                const region = prog.region_id ? regionMap.get(prog.region_id) : null
                const regionName = region
                  ? `${region.sido_name}${region.sigungu_name ? ` ${region.sigungu_name}` : ''}`
                  : '국가'
                const href = region
                  ? `/support/region/${region.slug}/${prog.slug}`
                  : `/support/national/${prog.slug}`

                return (
                  <li key={prog.id} className="hover:bg-gray-50">
                    <a href={href} className="flex items-center justify-between px-5 py-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {prog.name_ko}
                          </span>
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-blue-100 text-blue-800">
                            {PROGRAM_TYPE_LABEL[prog.program_type] ?? prog.program_type}
                          </span>
                          {prog.status === 'active' && (
                            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-100 text-green-800">
                              진행중
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{regionName}</span>
                      </div>
                      <span className="text-blue-600 text-sm shrink-0">&rarr;</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ── B2B 기관 도입 배너 ── */}
        <section
          aria-label="기관 도입 안내"
          className="border border-teal-200 rounded-xl px-6 py-6 bg-teal-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-teal-900">
              요양원·복지관을 운영하시나요?
            </h2>
            <p className="text-sm text-teal-800">
              기관용 도입 가이드, 지원사업 연계, 비용·효과 추정을 확인하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="/business/nursing-home"
              className="inline-flex items-center rounded-full bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700"
            >
              요양원 가이드
            </a>
            <a
              href="/business/welfare-center"
              className="inline-flex items-center rounded-full border border-teal-600 text-teal-700 px-4 py-2 text-sm font-medium hover:bg-teal-100"
            >
              복지관 가이드
            </a>
          </div>
        </section>

        {/* ── 하단 링크 ── */}
        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <a href="/about" className="hover:text-gray-800">사이트 소개</a>
          <a href="/privacy" className="hover:text-gray-800">개인정보처리방침</a>
          <a href="/terms" className="hover:text-gray-800">이용약관</a>
          <a href="/research" className="hover:text-gray-800">연구 자료</a>
        </footer>
      </div>
    </div>
  )
}
