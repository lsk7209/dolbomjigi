import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { robots, supportPrograms, regions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildHowToJsonLd, buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

// ─────────────────────────────────────────
// 기관 유형 정의 (정적 데이터)
// ─────────────────────────────────────────
interface BusinessType {
  slug: string
  name: string
  definition: string
  summary: string
  introSteps: string[]
  roiEstimate: {
    label: string
    value: string
    note: string
  }[]
  eligibleProgramTypes: string[]
  targetCategory: 'senior_care' | 'companion' | 'rehabilitation' | 'monitoring'
  contactNote: string
}

const BUSINESS_TYPES: BusinessType[] = [
  {
    slug: 'nursing-home',
    name: '요양원',
    definition:
      '노인장기요양보험법에 따라 운영되는 장기요양 서비스 제공 기관으로, 24시간 돌봄이 필요한 어르신을 대상으로 합니다.',
    summary:
      '요양원에서 돌봄로봇을 도입하면 야간 케어 부담 감소, 낙상 감지, 어르신 정서 지원 등 다양한 효과를 기대할 수 있습니다.',
    introSteps: [
      '기관 내 요구 분석 및 도입 목표 설정',
      '적합 제품 선정 및 시범 운영 신청',
      '보건복지부·지자체 지원사업 신청',
      '직원 교육 및 시범 운영 (1~3개월)',
      '효과 평가 및 확대 도입 결정',
    ],
    roiEstimate: [
      { label: '월 렌탈 비용', value: '30~80만 원/대', note: '기종·계약 조건에 따라 상이' },
      { label: '인력 절감 효과', value: '야간 순회 50% 감소', note: '시범 운영 평균 기준' },
      { label: '보조금 지원 시', value: '비용의 70~100%', note: '지자체 사업별 상이' },
    ],
    eligibleProgramTypes: ['free_distribution', 'rental', 'subsidy'],
    targetCategory: 'senior_care',
    contactNote: '보건복지부 노인정책과 또는 관할 지자체 노인복지 담당 부서에 문의하세요.',
  },
  {
    slug: 'welfare-center',
    name: '복지관',
    definition:
      '지역 어르신의 여가 활동, 건강 증진, 정서 지원을 위해 운영되는 사회복지 시설입니다.',
    summary:
      '복지관에서 돌봄로봇을 활용하면 프로그램 다양화, 어르신 정서 지원, 인지 훈련 등에 효과적으로 활용할 수 있습니다.',
    introSteps: [
      '지역사회 수요 조사 및 프로그램 연계 계획 수립',
      '지원사업 공모 참여 또는 자체 구매 검토',
      '담당 직원 교육 및 활용 프로그램 개발',
      '어르신 대상 시범 운영',
      '참여 어르신 만족도 조사 및 개선',
    ],
    roiEstimate: [
      { label: '프로그램 참여율', value: '20~40% 증가', note: '로봇 활용 프로그램 도입 시' },
      { label: '직원 부담', value: '반복 업무 30% 감소', note: '단순 케어 업무 기준' },
      { label: '지원 비율', value: '최대 100%', note: '공공누리 R&D 사업 해당 시' },
    ],
    eligibleProgramTypes: ['free_distribution', 'rd_grant'],
    targetCategory: 'companion',
    contactNote: '보건복지부 사회서비스자원과 또는 지역 사회복지협의회에 문의하세요.',
  },
]

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  return BUSINESS_TYPES.map((b) => ({ slug: b.slug }))
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
  const bizType = BUSINESS_TYPES.find((b) => b.slug === slug)

  if (!bizType) return { title: '페이지를 찾을 수 없습니다' }

  const title = `${bizType.name} 돌봄로봇 도입 가이드 | 돌봄지기`
  const description = bizType.summary

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    alternates: {
      canonical: `${SITE_URL}/business/${slug}`,
    },
  }
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const bizType = BUSINESS_TYPES.find((b) => b.slug === slug)
  if (!bizType) notFound()

  // 추천 제품 (카테고리 필터)
  const recommendedRobots = await db
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
    })
    .from(robots)
    .where(eq(robots.category, bizType.targetCategory))
    .catch(() => [] as Array<{
      id: number
      slug: string
      name_ko: string
      manufacturer: string
      category: string
      price_min: number | null
      price_max: number | null
      subscription_monthly: number | null
      rental_available: boolean
    }>)

  // 받을 수 있는 지원사업
  const coveredPrograms = await db
    .select({
      id: supportPrograms.id,
      slug: supportPrograms.slug,
      name_ko: supportPrograms.name_ko,
      program_type: supportPrograms.program_type,
      status: supportPrograms.status,
      region_id: supportPrograms.region_id,
    })
    .from(supportPrograms)
    .where(eq(supportPrograms.human_reviewed, true))
    .catch(() => [] as Array<{
      id: number
      slug: string
      name_ko: string
      program_type: 'free_distribution' | 'rental' | 'subsidy' | 'rd_grant'
      status: 'active' | 'closed' | 'unknown'
      region_id: number | null
    }>)

  const relevantPrograms = coveredPrograms
    .filter((p) =>
      bizType.eligibleProgramTypes.includes(p.program_type),
    )
    .slice(0, 5)

  const today = new Date().toISOString().slice(0, 10)

  const jsonLdData = [
    buildHowToJsonLd({
      name: `${bizType.name} 돌봄로봇 도입 절차`,
      steps: bizType.introSteps,
    }),
    buildArticleJsonLd({
      title: `${bizType.name} 돌봄로봇 도입 가이드`,
      description: bizType.summary,
      datePublished: today,
      dateModified: today,
      authorName: '돌봄지기 편집팀',
      url: `${SITE_URL}/business/${slug}`,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: 'B2B 도입 가이드', url: `${SITE_URL}/business` },
      {
        name: bizType.name,
        url: `${SITE_URL}/business/${slug}`,
      },
    ]),
  ]

  const PROGRAM_TYPE_LABEL: Record<string, string> = {
    free_distribution: '무상 보급',
    rental: '렌탈',
    subsidy: '보조금',
    rd_grant: 'R&D 지원',
  }

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* 브레드크럼 */}
        <nav className="text-xs text-gray-500" aria-label="breadcrumb">
          <ol className="flex items-center gap-1 flex-wrap">
            <li><a href="/" className="hover:underline">홈</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/business" className="hover:underline">B2B 도입 가이드</a></li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-800 font-medium">{bizType.name}</li>
          </ol>
        </nav>

        {/* 1. BusinessIntro */}
        <header className="flex flex-col gap-3">
          <span className="inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium bg-teal-100 text-teal-800">
            B2B 기관 도입 가이드
          </span>
          <h1 className="text-2xl font-bold text-gray-900">
            {bizType.name} 돌봄로봇 도입 가이드
          </h1>
          <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-gray-900 mb-1">시설 정의</p>
            <p>{bizType.definition}</p>
          </div>
        </header>

        {/* 2. AnswerBlock */}
        <AnswerBlock>{bizType.summary}</AnswerBlock>

        {/* 3. IntroductionFlow: HowTo */}
        <section aria-label="도입 절차">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">도입 절차</h2>
          <ol className="flex flex-col gap-3">
            {bizType.introSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-bold">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <span className="text-sm font-medium text-gray-900">{step}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. ROIEstimate */}
        <section aria-label="비용 및 운영 효율 추정">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            비용 · 운영 효율 추정
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">항목</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">추정치</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bizType.roiEstimate.map((row, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.label}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{row.value}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * 위 수치는 시범 운영 사례 및 공개 자료 기반 추정치이며, 실제 효과는 기관 환경에 따라 다를 수 있습니다.
          </p>
        </section>

        {/* 5. CoveredPrograms */}
        {relevantPrograms.length > 0 && (
          <section aria-label="받을 수 있는 지원사업">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              받을 수 있는 지원사업
            </h2>
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {relevantPrograms.map((prog) => (
                <li key={prog.id} className="bg-white hover:bg-gray-50">
                  <a
                    href={
                      prog.region_id
                        ? `/support/region/${prog.slug}`
                        : `/support/national/${prog.slug}`
                    }
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{prog.name_ko}</span>
                      <span className="text-xs text-gray-500">
                        {PROGRAM_TYPE_LABEL[prog.program_type] ?? prog.program_type}
                      </span>
                    </div>
                    <span className="text-blue-600 text-sm">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 6. RecommendedProducts */}
        {recommendedRobots.length > 0 && (
          <section aria-label="기관용 추천 제품">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              기관용 추천 제품
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedRobots.slice(0, 4).map((robot) => (
                <li key={robot.id} className="border border-gray-200 rounded-lg bg-white hover:shadow-sm">
                  <a href={`/robot/${robot.slug}`} className="flex flex-col gap-1 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">{robot.name_ko}</span>
                    <span className="text-xs text-gray-500">{robot.manufacturer}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {robot.rental_available && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-800">
                          렌탈 가능
                        </span>
                      )}
                      {robot.subscription_monthly && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
                          월 {(robot.subscription_monthly / 10000).toFixed(0)}만원~
                        </span>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. ContactBlock */}
        <section
          aria-label="도입 문의"
          className="border border-teal-200 rounded-lg px-5 py-4 bg-teal-50"
        >
          <h2 className="text-base font-semibold text-teal-900 mb-2">도입 문의</h2>
          <p className="text-sm text-teal-800 leading-relaxed">{bizType.contactNote}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://www.bokjiro.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
            >
              복지로 바로가기 &rarr;
            </a>
            <a
              href="https://www.mohw.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
            >
              보건복지부 바로가기 &rarr;
            </a>
          </div>
        </section>

        {/* Sources */}
        <Sources
          sources={[
            {
              type: 'government',
              label: '보건복지부 노인정책과',
              url: 'https://www.mohw.go.kr',
            },
            {
              type: 'government',
              label: '복지로',
              url: 'https://www.bokjiro.go.kr',
            },
            {
              type: 'official',
              label: '돌봄지기 편집팀 분석',
              url: SITE_URL,
            },
          ]}
        />
      </main>
    </>
  )
}
