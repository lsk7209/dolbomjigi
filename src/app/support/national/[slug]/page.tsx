import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { supportPrograms, programRobots, robots } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import UpdateNotice from '@/components/common/UpdateNotice'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import {
  buildGovernmentServiceJsonLd,
  buildBreadcrumbJsonLd,
} from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const programs = await db
      .select({ slug: supportPrograms.slug })
      .from(supportPrograms)
      .where(isNull(supportPrograms.region_id))
    return programs.map((p) => ({ slug: p.slug }))
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
  const program = await db
    .select()
    .from(supportPrograms)
    .where(and(eq(supportPrograms.slug, slug), isNull(supportPrograms.region_id)))
    .get()

  if (!program) return { title: '사업을 찾을 수 없습니다' }

  const title = `${program.name_ko} | 국가 돌봄로봇 지원사업`
  const description = `국가 단위 돌봄로봇 지원사업 ${program.name_ko}의 신청 자격, 지원 내용, 신청 방법을 안내합니다.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: {
      canonical: `${SITE_URL}/support/national/${slug}`,
    },
  }
}

// ─────────────────────────────────────────
// 자격 요건 파싱
// ─────────────────────────────────────────
interface EligibilityItem {
  category: string
  requirement: string
}

function parseEligibility(json: string | null | undefined): EligibilityItem[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed as EligibilityItem[]
    return Object.entries(parsed).map(([category, requirement]) => ({
      category,
      requirement: String(requirement),
    }))
  } catch {
    return []
  }
}

function parseApplicationMethod(text: string | null | undefined): string[] {
  if (!text) return []
  return text.split(/[\n;]/).map((s) => s.trim()).filter(Boolean)
}

const PROGRAM_TYPE_LABEL: Record<string, string> = {
  free_distribution: '무상 보급',
  rental: '렌탈',
  subsidy: '보조금',
  rd_grant: 'R&D 지원',
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function NationalSupportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const program = await db
    .select()
    .from(supportPrograms)
    .where(and(eq(supportPrograms.slug, slug), isNull(supportPrograms.region_id)))
    .get()

  if (!program || !program.human_reviewed) notFound()

  const coveredRobots = await db
    .select({
      id: robots.id,
      slug: robots.slug,
      name_ko: robots.name_ko,
      manufacturer: robots.manufacturer,
    })
    .from(programRobots)
    .innerJoin(robots, eq(programRobots.robot_id, robots.id))
    .where(eq(programRobots.program_id, program.id))

  const eligibilityItems = parseEligibility(program.eligibility_json)
  const applicationSteps = parseApplicationMethod(program.application_method)
  const today = new Date().toISOString().slice(0, 10)
  const programYear = program.period_start
    ? new Date(program.period_start).getFullYear()
    : new Date().getFullYear()

  const jsonLdData = [
    buildGovernmentServiceJsonLd({
      name: program.name_ko,
      description: `국가 단위 돌봄로봇 지원사업: ${program.name_ko}`,
      url: `${SITE_URL}/support/national/${slug}`,
      areaServed: '대한민국',
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '지원사업', url: `${SITE_URL}/support` },
      { name: '국가사업', url: `${SITE_URL}/support/national` },
      {
        name: program.name_ko,
        url: `${SITE_URL}/support/national/${slug}`,
      },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* Hero */}
        <header className="flex flex-col gap-2">
          <nav className="text-xs text-gray-500" aria-label="breadcrumb">
            <ol className="flex items-center gap-1 flex-wrap">
              <li><a href="/" className="hover:underline">홈</a></li>
              <li aria-hidden="true">/</li>
              <li><a href="/support" className="hover:underline">지원사업</a></li>
              <li aria-hidden="true">/</li>
              <li><a href="/support/national" className="hover:underline">국가사업</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-800 font-medium">{program.name_ko}</li>
            </ol>
          </nav>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
              국가 단위 사업
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
              {PROGRAM_TYPE_LABEL[program.program_type] ?? program.program_type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {program.name_ko}{' '}
            <span className="text-gray-500 text-xl">({programYear}년)</span>
          </h1>
        </header>

        {/* AnswerBlock */}
        <AnswerBlock>
          <strong>{program.name_ko}</strong>은(는) 전국 단위로 운영되는{' '}
          {PROGRAM_TYPE_LABEL[program.program_type]} 방식의 돌봄로봇 지원사업입니다.
          {eligibilityItems.length > 0
            ? ` 신청 대상: ${eligibilityItems.map((e) => e.requirement).slice(0, 2).join(', ')}.`
            : ''}
          {program.distribution_count
            ? ` 총 ${program.distribution_count.toLocaleString()}대 보급 예정입니다.`
            : ''}
        </AnswerBlock>

        {/* 자격 요건 */}
        {eligibilityItems.length > 0 && (
          <section aria-label="신청 자격 요건">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">신청 자격 요건</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">구분</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">요건</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eligibilityItems.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.category}</td>
                      <td className="px-4 py-3 text-gray-700">{item.requirement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 신청 방법 */}
        <section aria-label="신청 방법 및 기한">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">신청 방법 및 기한</h2>
          <div className="flex flex-col gap-3">
            {(program.period_start || program.period_end) && (
              <div className="flex gap-3 items-start bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
                <span className="font-semibold text-blue-800 shrink-0">신청 기간</span>
                <span className="text-gray-700">
                  {program.period_start
                    ? new Date(program.period_start).toLocaleDateString('ko-KR')
                    : '미정'}{' '}
                  ~{' '}
                  {program.period_end
                    ? new Date(program.period_end).toLocaleDateString('ko-KR')
                    : '미정'}
                </span>
              </div>
            )}
            {applicationSteps.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {applicationSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-600">
                관할 지자체 또는 보건복지부 복지로(bokjiro.go.kr)를 통해 신청하시기 바랍니다.
              </p>
            )}
            {program.application_url && (
              <a
                href={program.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                온라인 신청 바로가기 &rarr;
              </a>
            )}
          </div>
        </section>

        {/* 지원 내용 */}
        <section aria-label="지원 내용">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">지원 내용</h2>
          <div className="grid grid-cols-2 gap-3">
            {program.budget && (
              <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">사업 예산</p>
                <p className="font-semibold text-gray-900">
                  {(program.budget / 100000000).toFixed(1)}억 원
                </p>
              </div>
            )}
            {program.distribution_count && (
              <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">보급 대수</p>
                <p className="font-semibold text-gray-900">
                  {program.distribution_count.toLocaleString()}대
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 지원 제품 */}
        {coveredRobots.length > 0 && (
          <section aria-label="적용 제품">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">지원 대상 제품</h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {coveredRobots.map((robot) => (
                <li key={robot.id} className="bg-white hover:bg-gray-50">
                  <a
                    href={`/robot/${robot.slug}`}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{robot.name_ko}</span>
                      <span className="ml-2 text-xs text-gray-500">{robot.manufacturer}</span>
                    </div>
                    <span className="text-blue-600 text-sm">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* UpdateNotice */}
        <UpdateNotice
          sourceUrl={program.source_url}
          sourceName="보건복지부 / 관련 기관"
          license={program.source_license}
          confirmedAt={today}
          publicationDate={
            program.source_publication_date
              ? new Date(program.source_publication_date).toISOString().slice(0, 10)
              : undefined
          }
        />

        {/* Sources */}
        <Sources
          sources={[
            {
              type: 'government',
              label: '보건복지부',
              url: 'https://www.mohw.go.kr',
            },
            {
              type: 'government',
              label: '복지로',
              url: 'https://www.bokjiro.go.kr',
            },
            {
              type: 'official',
              label: '원문 출처',
              url: program.source_url,
              license: program.source_license,
            },
          ]}
        />
      </main>
    </>
  )
}
