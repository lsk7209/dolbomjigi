import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/config'
import { db } from '@/db/client'
import { supportPrograms, regions } from '@/db/schema'
import { isNull, and, eq } from 'drizzle-orm'

export const metadata: Metadata = {
  title: '돌봄 로봇 지원사업 — 돌봄지기',
  description:
    '국가·지자체 돌봄로봇 무상 보급, 렌탈, 보조금, R&D 지원사업 정보를 확인하세요. 지역별 신청 안내 포함.',
  openGraph: {
    title: '돌봄 로봇 지원사업 — 돌봄지기',
    description: '국가·지역별 돌봄로봇 지원사업 신청 안내. 무상 보급·렌탈·보조금 포함.',
    url: `${SITE_URL}/support`,
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: `${SITE_URL}/support` },
}

const PROGRAM_TYPE_LABEL: Record<string, string> = {
  free_distribution: '무상 보급',
  rental: '렌탈',
  subsidy: '보조금',
  rd_grant: 'R&D 지원',
}

const PROGRAM_TYPE_COLOR: Record<string, string> = {
  free_distribution: 'bg-green-100 text-green-800',
  rental: 'bg-blue-100 text-blue-800',
  subsidy: 'bg-yellow-100 text-yellow-800',
  rd_grant: 'bg-purple-100 text-purple-800',
}

export default async function SupportListPage() {
  // 국가 지원사업 (region_id IS NULL AND human_reviewed = true)
  const nationalPrograms = await db
    .select({
      id: supportPrograms.id,
      slug: supportPrograms.slug,
      name_ko: supportPrograms.name_ko,
      program_type: supportPrograms.program_type,
      status: supportPrograms.status,
      period_end: supportPrograms.period_end,
      application_url: supportPrograms.application_url,
    })
    .from(supportPrograms)
    .where(and(isNull(supportPrograms.region_id), eq(supportPrograms.human_reviewed, true)))
    .catch(() => [] as Array<{
      id: number
      slug: string
      name_ko: string
      program_type: 'free_distribution' | 'rental' | 'subsidy' | 'rd_grant'
      status: 'active' | 'closed' | 'unknown'
      period_end: Date | null
      application_url: string | null
    }>)

  // 시도(sido) 단위 지역 전체
  const allSidoRegions = await db
    .select({
      id: regions.id,
      slug: regions.slug,
      sido_name: regions.sido_name,
      level: regions.level,
    })
    .from(regions)
    .where(eq(regions.level, 'sido'))
    .catch(() => [] as typeof regions.$inferSelect[])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 지원사업</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 지원사업 안내
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            국가 및 지자체에서 운영하는 돌봄로봇 지원사업을 확인하세요.
            무상 보급·렌탈·보조금·R&amp;D 지원 등 유형별로 안내해 드립니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-10">

        {/* ── 국가 지원사업 ── */}
        <section aria-labelledby="national-programs-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="national-programs-heading" className="text-xl font-bold text-gray-900">
              국가 지원사업
            </h2>
            <span className="text-xs text-gray-500">전문가 검증 완료</span>
          </div>

          {nationalPrograms.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center border border-gray-200 rounded-xl bg-white">
              현재 검증된 국가 지원사업이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {nationalPrograms.map((prog) => (
                <li key={prog.id} className="hover:bg-gray-50 transition-colors">
                  <a
                    href={`/support/national/${prog.slug}`}
                    className="flex items-center justify-between px-5 py-4 gap-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {prog.name_ko}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${PROGRAM_TYPE_COLOR[prog.program_type] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {PROGRAM_TYPE_LABEL[prog.program_type] ?? prog.program_type}
                        </span>
                        {prog.status === 'active' && (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-100 text-green-800">
                            진행중
                          </span>
                        )}
                        {prog.status === 'closed' && (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-500">
                            마감
                          </span>
                        )}
                        {prog.status === 'unknown' && (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-slate-100 text-slate-600">
                            확인 필요
                          </span>
                        )}
                      </div>
                      {prog.period_end && (
                        <span className="text-xs text-gray-400">
                          신청 마감: {new Date(prog.period_end).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                    <span className="text-blue-600 text-sm shrink-0">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 지역별 지원사업 ── */}
        <section aria-labelledby="regional-programs-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="regional-programs-heading" className="text-xl font-bold text-gray-900">
              지역별 지원사업
            </h2>
            <span className="text-xs text-gray-500">시·도 선택</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            거주 지역을 선택하면 해당 지자체의 돌봄로봇 지원사업을 확인할 수 있습니다.
          </p>

          {allSidoRegions.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center border border-gray-200 rounded-xl bg-white">
              등록된 지역 정보가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allSidoRegions.map((region) => (
                <a
                  key={region.id}
                  href={`/support/region/${region.slug}`}
                  className="flex items-center justify-between border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-800">{region.sido_name}</span>
                  <span className="text-blue-500 text-xs">&rarr;</span>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ── 안내 배너 ── */}
        <div className="border border-teal-200 rounded-xl bg-teal-50 px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-teal-900">기관·시설 도입을 고려 중이신가요?</p>
            <p className="text-xs text-teal-800">
              요양원·복지관 전용 도입 가이드와 기관 지원사업 연계 정보를 확인하세요.
            </p>
          </div>
          <Link
            href="/business/nursing-home"
            className="inline-flex items-center rounded-full bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 shrink-0"
          >
            기관 도입 가이드
          </Link>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <Link href="/" className="hover:text-gray-800">홈</Link>
          <Link href="/robot" className="hover:text-gray-800">제품 목록</Link>
          <Link href="/guide" className="hover:text-gray-800">이용 가이드</Link>
          <Link href="/info" className="hover:text-gray-800">정보</Link>
        </footer>
      </div>
    </div>
  )
}
