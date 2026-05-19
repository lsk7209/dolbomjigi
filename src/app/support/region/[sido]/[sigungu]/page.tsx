import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { regions, supportPrograms, programRobots, robots } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import UpdateNotice from '@/components/common/UpdateNotice'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import {
  buildGovernmentServiceJsonLd,
  buildBreadcrumbJsonLd,
} from '@/lib/jsonld'

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const sigunguRegions = await db
      .select({ slug: regions.slug, sido_code: regions.sido_code })
      .from(regions)
      .where(eq(regions.level, 'sigungu'))

    // 각 sigungu의 sido slug도 필요
    const sidoRegions = await db
      .select({ sido_code: regions.sido_code, slug: regions.slug })
      .from(regions)
      .where(eq(regions.level, 'sido'))

    const sidoMap = new Map(sidoRegions.map((r) => [r.sido_code, r.slug]))

    return sigunguRegions.map((r) => ({
      sido: sidoMap.get(r.sido_code) ?? r.sido_code,
      sigungu: r.slug,
    }))
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
  params: Promise<{ sido: string; sigungu: string }>
}): Promise<Metadata> {
  const { sigungu } = await params

  const region = await db
    .select()
    .from(regions)
    .where(and(eq(regions.slug, sigungu), eq(regions.level, 'sigungu')))
    .get()

  if (!region) return { title: '지역을 찾을 수 없습니다' }

  const program = await db
    .select({ name_ko: supportPrograms.name_ko })
    .from(supportPrograms)
    .where(
      and(
        eq(supportPrograms.region_id, region.id),
        eq(supportPrograms.human_reviewed, true),
      ),
    )
    .get()

  const title = program
    ? `${region.sigungu_name ?? region.sido_name} ${program.name_ko} 신청 안내`
    : `${region.sigungu_name ?? region.sido_name} 돌봄로봇 지원사업`

  const description = `${region.sigungu_name ?? region.sido_name} 돌봄로봇 지원사업 자격 요건, 신청 방법, 지원 내용 안내.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://dolbomjigi.com/support/region/${(await params).sido}/${sigungu}`,
    },
  }
}

// ─────────────────────────────────────────
// 자격 요건 파싱 타입
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
    // 객체 형태인 경우 변환
    return Object.entries(parsed).map(([category, requirement]) => ({
      category,
      requirement: String(requirement),
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 신청 방법 파싱
// ─────────────────────────────────────────
function parseApplicationMethod(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .split(/[\n;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─────────────────────────────────────────
// 지원 유형 한글
// ─────────────────────────────────────────
const PROGRAM_TYPE_LABEL: Record<string, string> = {
  free_distribution: '무상 보급',
  rental: '렌탈',
  subsidy: '보조금',
  rd_grant: 'R&D 지원',
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function SigunguSupportPage({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>
}) {
  const { sido, sigungu } = await params

  // sigungu region 조회
  const region = await db
    .select()
    .from(regions)
    .where(and(eq(regions.slug, sigungu), eq(regions.level, 'sigungu')))
    .get()

  if (!region) notFound()

  // 해당 지역의 human_reviewed=true 프로그램
  const program = await db
    .select()
    .from(supportPrograms)
    .where(
      and(
        eq(supportPrograms.region_id, region.id),
        eq(supportPrograms.human_reviewed, true),
      ),
    )
    .get()

  // human_reviewed=false이면 게시 불가
  if (!program) notFound()

  // 해당 프로그램에 연결된 로봇 목록
  const coveredRobots = await db
    .select({
      id: robots.id,
      slug: robots.slug,
      name_ko: robots.name_ko,
      manufacturer: robots.manufacturer,
      category: robots.category,
    })
    .from(programRobots)
    .innerJoin(robots, eq(programRobots.robot_id, robots.id))
    .where(eq(programRobots.program_id, program.id))

  // 인근 시군구 (같은 시도 내)
  const siblingRegions = await db
    .select({ slug: regions.slug, sigungu_name: regions.sigungu_name })
    .from(regions)
    .where(
      and(
        eq(regions.sido_code, region.sido_code),
        eq(regions.level, 'sigungu'),
      ),
    )
  const relatedRegions = siblingRegions.filter((r) => r.slug !== sigungu).slice(0, 6)

  const eligibilityItems = parseEligibility(program.eligibility_json)
  const applicationSteps = parseApplicationMethod(program.application_method)
  const today = new Date().toISOString().slice(0, 10)

  const programYear = program.period_start
    ? new Date(program.period_start).getFullYear()
    : new Date().getFullYear()

  const jsonLdData = [
    buildGovernmentServiceJsonLd({
      name: program.name_ko,
      description: `${region.sigungu_name ?? region.sido_name} 돌봄로봇 지원사업`,
      url: `https://dolbomjigi.com/support/region/${sido}/${sigungu}`,
      areaServed: region.sigungu_name ?? region.sido_name,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: 'https://dolbomjigi.com' },
      { name: '지원사업', url: 'https://dolbomjigi.com/support' },
      {
        name: region.sido_name,
        url: `https://dolbomjigi.com/support/region/${sido}`,
      },
      {
        name: region.sigungu_name ?? '',
        url: `https://dolbomjigi.com/support/region/${sido}/${sigungu}`,
      },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* 1. ProgramHero */}
        <header className="flex flex-col gap-2">
          <nav className="text-xs text-gray-500" aria-label="breadcrumb">
            <ol className="flex items-center gap-1 flex-wrap">
              <li>
                <a href="/" className="hover:underline">홈</a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href="/support" className="hover:underline">지원사업</a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href={`/support/region/${sido}`} className="hover:underline">
                  {region.sido_name}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-800 font-medium">
                {region.sigungu_name}
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            {region.sigungu_name ?? region.sido_name}{' '}
            {program.name_ko}{' '}
            <span className="text-gray-500 text-xl">({programYear}년)</span>
          </h1>
          <p className="text-sm text-gray-600">
            사업 유형:{' '}
            <span className="font-medium">
              {PROGRAM_TYPE_LABEL[program.program_type] ?? program.program_type}
            </span>
            {program.status === 'active' && (
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                진행중
              </span>
            )}
            {program.status === 'closed' && (
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                종료
              </span>
            )}
          </p>
        </header>

        {/* 2. AnswerBlock */}
        <AnswerBlock>
          {region.sigungu_name ?? region.sido_name}의{' '}
          <strong>{program.name_ko}</strong>은(는){' '}
          {PROGRAM_TYPE_LABEL[program.program_type]} 방식으로 운영됩니다.
          {eligibilityItems.length > 0
            ? ` 신청 자격은 ${eligibilityItems.map((e) => e.requirement).slice(0, 2).join(', ')} 등입니다.`
            : ''}
          {program.application_url
            ? ' 온라인 신청이 가능합니다.'
            : ' 읍·면·동 주민센터를 통해 신청하실 수 있습니다.'}
        </AnswerBlock>

        {/* 3. EligibilityTable */}
        {eligibilityItems.length > 0 && (
          <section aria-label="신청 자격 요건">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              신청 자격 요건
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">
                      구분
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      요건
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eligibilityItems.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.requirement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. ApplicationFlow */}
        <section aria-label="신청 방법 및 기한">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            신청 방법 및 기한
          </h2>
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

            {applicationSteps.length > 0 && (
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

            {!program.application_url && !applicationSteps.length && (
              <p className="text-sm text-gray-600">
                읍·면·동 주민센터 또는 해당 지자체 복지 담당 부서에 방문하여 신청하시기 바랍니다.
              </p>
            )}
          </div>
        </section>

        {/* 5. SupportContent */}
        <section aria-label="지원 내용">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">지원 내용</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-700">
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
            <p className="text-gray-600">
              지원 방식:{' '}
              <span className="font-medium text-gray-900">
                {PROGRAM_TYPE_LABEL[program.program_type] ?? program.program_type}
              </span>
            </p>
          </div>
        </section>

        {/* 6. CoveredRobots */}
        {coveredRobots.length > 0 && (
          <section aria-label="적용 제품">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              지원 대상 제품
            </h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {coveredRobots.map((robot) => (
                <li key={robot.id} className="bg-white hover:bg-gray-50">
                  <a
                    href={`/robot/${robot.slug}`}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {robot.name_ko}
                      </span>
                      <span className="text-xs text-gray-500">
                        {robot.manufacturer}
                      </span>
                    </div>
                    <span className="text-blue-600 text-sm">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. UpdateNotice */}
        <UpdateNotice
          sourceUrl={program.source_url}
          sourceName="지자체 공식 채널"
          license={program.source_license}
          confirmedAt={today}
          publicationDate={
            program.source_publication_date
              ? new Date(program.source_publication_date).toISOString().slice(0, 10)
              : undefined
          }
        />

        {/* 8. RelatedRegions */}
        {relatedRegions.length > 0 && (
          <section aria-label="인근 지자체 지원사업">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {region.sido_name} 내 다른 지자체
            </h2>
            <ul className="flex flex-wrap gap-2">
              {relatedRegions.map((r) => (
                <li key={r.slug}>
                  <a
                    href={`/support/region/${sido}/${r.slug}`}
                    className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {r.sigungu_name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sources */}
        <Sources
          sources={[
            {
              type: 'government',
              label: '지자체 공식 채널',
              url: program.source_url,
              license: program.source_license,
            },
            {
              type: 'government',
              label: '복지로 (보건복지부)',
              url: 'https://www.bokjiro.go.kr',
            },
          ]}
        />
      </main>
    </>
  )
}
