import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'
import { db } from '@/db/client'
import { comparisons } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄 로봇 비교 — 돌봄지기',
  description:
    '돌봄로봇 제품 간 상세 비교표를 확인하세요. 기능·가격·추천 대상을 항목별로 비교해 어르신에게 맞는 제품을 선택할 수 있습니다.',
  openGraph: {
    title: '돌봄 로봇 비교 — 돌봄지기',
    description: '돌봄로봇 제품별 기능·가격·추천 대상 상세 비교.',
    url: `${SITE_URL}/compare`,
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: `${SITE_URL}/compare` },
}

export default async function CompareListPage() {
  const allComparisons = await db
    .select({
      id: comparisons.id,
      slug: comparisons.slug,
      title_ko: comparisons.title_ko,
      summary: comparisons.summary,
      recommended_persona: comparisons.recommended_persona,
      published_at: comparisons.published_at,
    })
    .from(comparisons)
    .orderBy(desc(comparisons.published_at))
    .catch(() => [] as typeof comparisons.$inferSelect[])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 제품 비교</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 비교
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            비슷한 기능의 돌봄로봇을 나란히 비교해 드립니다.
            가격·기능·추천 대상을 항목별로 확인하고 어르신 상황에 맞는 제품을 선택하세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-8">

        {/* ── 비교 카드 목록 ── */}
        {allComparisons.length === 0 ? (
          <p className="text-sm text-gray-500 py-16 text-center border border-gray-200 rounded-xl bg-white">
            등록된 비교 자료가 없습니다.
          </p>
        ) : (
          <section aria-label="비교 목록">
            <p className="text-xs text-gray-500 mb-4">총 {allComparisons.length}건</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allComparisons.map((comp) => {
                const truncatedSummary =
                  comp.summary && comp.summary.length > 100
                    ? comp.summary.slice(0, 100) + '…'
                    : comp.summary

                return (
                  <a
                    key={comp.id}
                    href={`/compare/${comp.slug}`}
                    className="flex flex-col gap-3 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all px-5 py-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0" aria-hidden="true">⚖️</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900 leading-snug">
                          {comp.title_ko}
                        </span>
                        {truncatedSummary && (
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {truncatedSummary}
                          </p>
                        )}
                      </div>
                    </div>

                    {comp.recommended_persona && (
                      <div className="pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          추천 대상: {comp.recommended_persona}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      {comp.published_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(comp.published_at).toLocaleDateString('ko-KR')} 게시
                        </span>
                      )}
                      <span className="text-blue-600 text-sm ml-auto">&rarr; 비교 보기</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 관련 안내 ── */}
        <div className="border border-blue-100 rounded-xl bg-blue-50 px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-blue-900">직접 제품을 찾아보시겠어요?</p>
            <p className="text-xs text-blue-800">전체 제품 목록에서 카테고리별로 탐색할 수 있습니다.</p>
          </div>
          <a
            href="/robot"
            className="inline-flex items-center rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 shrink-0"
          >
            제품 목록 보기
          </a>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <a href="/" className="hover:text-gray-800">홈</a>
          <a href="/robot" className="hover:text-gray-800">제품 목록</a>
          <a href="/support" className="hover:text-gray-800">지원사업</a>
          <a href="/guide" className="hover:text-gray-800">이용 가이드</a>
        </footer>
      </div>
    </div>
  )
}
