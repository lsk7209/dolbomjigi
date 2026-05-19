import type { Metadata } from 'next'
import { db } from '@/db/client'
import { infoArticles } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄 로봇 정보 — 돌봄지기',
  description:
    '돌봄로봇 기술·통계·정책·비교·역사 관련 정보 자료를 확인하세요. 신뢰할 수 있는 공공 데이터 기반 콘텐츠.',
  openGraph: {
    title: '돌봄 로봇 정보 — 돌봄지기',
    description: '돌봄로봇 기술·통계·정책 정보 자료 모음.',
    url: 'https://dolbomjigi.com/info',
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: 'https://dolbomjigi.com/info' },
}

const TOPIC_LABEL: Record<string, string> = {
  technology: '기술',
  statistics: '통계',
  policy: '정책',
  comparison: '비교',
  history: '역사',
}

const TOPIC_COLOR: Record<string, string> = {
  technology: 'bg-blue-100 text-blue-800',
  statistics: 'bg-purple-100 text-purple-800',
  policy: 'bg-green-100 text-green-800',
  comparison: 'bg-orange-100 text-orange-800',
  history: 'bg-gray-100 text-gray-700',
}

export default async function InfoListPage() {
  const allArticles = await db
    .select({
      id: infoArticles.id,
      slug: infoArticles.slug,
      title_ko: infoArticles.title_ko,
      summary: infoArticles.summary,
      topic_category: infoArticles.topic_category,
      published_at: infoArticles.published_at,
      updated_at: infoArticles.updated_at,
    })
    .from(infoArticles)
    .orderBy(desc(infoArticles.published_at))
    .catch(() => [] as typeof infoArticles.$inferSelect[])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 정보</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 정보
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            돌봄로봇 기술 동향, 통계, 정책, 비교 분석 등 신뢰할 수 있는 정보 자료를 모았습니다.
            공공 데이터와 전문가 검증을 거친 콘텐츠를 확인하세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-8">

        {/* ── 아티클 목록 ── */}
        {allArticles.length === 0 ? (
          <p className="text-sm text-gray-500 py-16 text-center border border-gray-200 rounded-xl bg-white">
            등록된 정보 자료가 없습니다.
          </p>
        ) : (
          <section aria-label="정보 자료 목록">
            <p className="text-xs text-gray-500 mb-4">총 {allArticles.length}건</p>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {allArticles.map((article) => {
                const dateLabel = article.published_at
                  ? new Date(article.published_at).toLocaleDateString('ko-KR')
                  : null

                return (
                  <li key={article.id} className="hover:bg-gray-50 transition-colors">
                    <a
                      href={`/info/${article.slug}`}
                      className="flex flex-col gap-1.5 px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {article.topic_category && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TOPIC_COLOR[article.topic_category] ?? 'bg-gray-100 text-gray-700'}`}
                              >
                                {TOPIC_LABEL[article.topic_category] ?? article.topic_category}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {article.title_ko}
                            </span>
                          </div>
                          {article.summary && (
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                        </div>
                        <span className="text-blue-600 text-sm shrink-0 mt-0.5">&rarr;</span>
                      </div>
                      {dateLabel && (
                        <span className="text-xs text-gray-400">{dateLabel} 게시</span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* ── 관련 섹션 링크 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/robot"
            className="flex flex-col gap-1 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all px-5 py-4"
          >
            <span className="text-sm font-semibold text-gray-900">제품 목록</span>
            <span className="text-xs text-gray-500">돌봄로봇 제품 정보와 가격 비교</span>
          </a>
          <a
            href="/support"
            className="flex flex-col gap-1 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-green-200 transition-all px-5 py-4"
          >
            <span className="text-sm font-semibold text-gray-900">지원사업</span>
            <span className="text-xs text-gray-500">국가·지역별 보급·보조금 사업 안내</span>
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
