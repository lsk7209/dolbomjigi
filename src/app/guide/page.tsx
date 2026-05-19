import type { Metadata } from 'next'
import { db } from '@/db/client'
import { guides } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄 로봇 선택 가이드 — 돌봄지기',
  description:
    '가족 돌봄자, 사회복지사, 복지 담당 공무원, 요양기관 등 대상별 돌봄로봇 선택·도입 가이드를 확인하세요.',
  openGraph: {
    title: '돌봄 로봇 선택 가이드 — 돌봄지기',
    description: '대상별 돌봄로봇 선택·신청·도입 가이드 모음.',
    url: 'https://dolbomjigi.com/guide',
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: 'https://dolbomjigi.com/guide' },
}

const PERSONA_LABEL: Record<string, string> = {
  family_caregiver: '가족 돌봄자',
  social_worker: '사회복지사',
  public_servant: '복지 담당 공무원',
  institution: '요양기관·시설',
}

const PERSONA_DESC: Record<string, string> = {
  family_caregiver: '어르신을 직접 돌보는 가족을 위한 선택·활용 가이드',
  social_worker: '복지관·센터에서 어르신을 지원하는 사회복지사를 위한 가이드',
  public_servant: '지자체·복지부 담당 공무원을 위한 지원사업 활용 가이드',
  institution: '요양원·복지관·노인주간보호센터 도입 담당자를 위한 가이드',
}

const PERSONA_COLOR: Record<string, string> = {
  family_caregiver: 'border-blue-200 bg-blue-50',
  social_worker: 'border-green-200 bg-green-50',
  public_servant: 'border-purple-200 bg-purple-50',
  institution: 'border-teal-200 bg-teal-50',
}

const PERSONA_BADGE: Record<string, string> = {
  family_caregiver: 'bg-blue-100 text-blue-800',
  social_worker: 'bg-green-100 text-green-800',
  public_servant: 'bg-purple-100 text-purple-800',
  institution: 'bg-teal-100 text-teal-800',
}

const PERSONA_ORDER = ['family_caregiver', 'social_worker', 'public_servant', 'institution'] as const

export default async function GuideListPage() {
  const allGuides = await db
    .select({
      id: guides.id,
      slug: guides.slug,
      title_ko: guides.title_ko,
      persona_group: guides.persona_group,
      scenario: guides.scenario,
      published_at: guides.published_at,
    })
    .from(guides)
    .orderBy(desc(guides.published_at))
    .catch(() => [] as typeof guides.$inferSelect[])

  const byPersona = PERSONA_ORDER.reduce<Record<string, typeof allGuides>>((acc, persona) => {
    acc[persona] = allGuides.filter((g) => g.persona_group === persona)
    return acc
  }, {})

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 이용 가이드</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 선택 가이드
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            돌봄 현장의 역할별로 꼭 필요한 정보를 모았습니다.
            아래에서 나의 역할에 맞는 가이드를 선택하세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-10">

        {PERSONA_ORDER.map((persona) => {
          const personaGuides = byPersona[persona]
          return (
            <section key={persona} aria-labelledby={`persona-${persona}`}>
              <div className={`border rounded-xl px-5 py-4 mb-4 ${PERSONA_COLOR[persona]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PERSONA_BADGE[persona]}`}
                  >
                    {PERSONA_LABEL[persona]}
                  </span>
                </div>
                <h2
                  id={`persona-${persona}`}
                  className="text-base font-bold text-gray-900"
                >
                  {PERSONA_LABEL[persona]}을 위한 가이드
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">{PERSONA_DESC[persona]}</p>
              </div>

              {personaGuides.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center border border-gray-200 rounded-xl bg-white">
                  아직 등록된 가이드가 없습니다.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {personaGuides.map((guide) => (
                    <li key={guide.id} className="hover:bg-gray-50 transition-colors">
                      <a
                        href={`/guide/${guide.slug}`}
                        className="flex items-start justify-between px-5 py-4 gap-3"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900">
                            {guide.title_ko}
                          </span>
                          {guide.scenario && (
                            <span className="text-xs text-gray-500 leading-relaxed">
                              {guide.scenario}
                            </span>
                          )}
                        </div>
                        <span className="text-blue-600 text-sm shrink-0 mt-0.5">&rarr;</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}

        {/* ── 제품 탐색 배너 ── */}
        <div className="border border-gray-200 rounded-xl bg-white px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-gray-900">제품을 직접 비교해보고 싶으신가요?</p>
            <p className="text-xs text-gray-500">전체 제품 목록과 상세 비교 자료를 확인하세요.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="/robot"
              className="inline-flex items-center rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              제품 목록
            </a>
            <a
              href="/compare"
              className="inline-flex items-center rounded-full border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              제품 비교
            </a>
          </div>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <a href="/" className="hover:text-gray-800">홈</a>
          <a href="/robot" className="hover:text-gray-800">제품 목록</a>
          <a href="/support" className="hover:text-gray-800">지원사업</a>
          <a href="/info" className="hover:text-gray-800">정보</a>
        </footer>
      </div>
    </div>
  )
}
