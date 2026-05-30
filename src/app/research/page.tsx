import type { Metadata } from 'next'
import { db } from '@/db/client'
import { researchStudies } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄로봇 연구 논문 목록 | 돌봄지기',
  description:
    '돌봄로봇의 효과, 기술, 정책에 관한 국내외 학술 연구 논문을 모았습니다. 연도·저널별로 정리된 최신 연구를 확인하세요.',
  openGraph: {
    title: '돌봄로봇 연구 논문 목록 | 돌봄지기',
    description: '국내외 돌봄로봇 학술 연구 논문 모음',
    url: 'https://dolbomjigi.com/research',
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: 'https://dolbomjigi.com/research' },
}

export default async function ResearchListPage() {
  const studies = await db
    .select({
      id: researchStudies.id,
      slug: researchStudies.slug,
      title: researchStudies.title,
      authors_list: researchStudies.authors_list,
      journal: researchStudies.journal,
      year: researchStudies.year,
      summary_ko: researchStudies.summary_ko,
    })
    .from(researchStudies)
    .orderBy(desc(researchStudies.year))
    .catch(() => [] as typeof researchStudies.$inferSelect[])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-purple-600 font-medium mb-1">돌봄지기 &rsaquo; 연구</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄로봇 연구 논문
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            돌봄로봇의 효과·기술·정책에 관한 국내외 학술 연구 논문을 정리했습니다.
            각 논문의 핵심 결과와 한국 현장 적용 시사점을 함께 제공합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-4">
        {studies.length === 0 ? (
          <p className="text-sm text-gray-500 py-16 text-center border border-gray-200 rounded-xl bg-white">
            등록된 연구가 없습니다.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">총 {studies.length}편</p>
            {studies.map((study) => (
              <a
                key={study.id}
                href={`/research/${study.slug}`}
                className="flex flex-col gap-2 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-purple-200 transition-all px-5 py-4"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                    {study.title}
                  </span>
                  {study.year && (
                    <span className="inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">
                      {study.year}년
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {study.authors_list}
                  {study.journal ? ` · ${study.journal}` : ''}
                </p>
                {study.summary_ko && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {study.summary_ko}
                  </p>
                )}
                <span className="text-xs text-purple-600 mt-0.5">논문 보기 &rarr;</span>
              </a>
            ))}
          </>
        )}

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6 mt-4">
          <a href="/" className="hover:text-gray-800">홈</a>
          <a href="/info" className="hover:text-gray-800">정보</a>
          <a href="/guide" className="hover:text-gray-800">이용 가이드</a>
          <a href="/robot" className="hover:text-gray-800">제품 목록</a>
        </footer>
      </div>
    </div>
  )
}
