import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import {
  robots,
  authors,
  robotRegionAvailability,
  regions,
} from '@/db/schema'

import JsonLdScript from '@/components/seo/JsonLdScript'
import AnswerBlock from '@/components/common/AnswerBlock'
import FAQSection from '@/components/common/FAQSection'
import Sources from '@/components/common/Sources'
import AuthorBlock from '@/components/common/AuthorBlock'
import RobotHero from '@/components/robot/RobotHero'
import FeatureList from '@/components/robot/FeatureList'
import PricingTable from '@/components/robot/PricingTable'
import RegionalAvailability from '@/components/robot/RegionalAvailability'

import {
  buildProductJsonLd,
  buildFAQJsonLd,
  buildBreadcrumbJsonLd,
} from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

import type { Robot } from '@/types'

// ─────────────────────────────────────────
// 카테고리 한국어
// ─────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  companion: '반려·동행 로봇',
  senior_care: '노인돌봄 로봇',
  rehabilitation: '재활 로봇',
  monitoring: '모니터링 로봇',
}

const PERSONA_MAP: Record<string, { label: string; guideSlug: string; desc: string }[]> = {
  companion: [
    { label: '독거 어르신', guideSlug: 'senior-alone', desc: '혼자 생활하는 어르신의 대화 상대·긴급 알림용으로 적합합니다.' },
    { label: '경증 인지저하 노인', guideSlug: 'mild-dementia', desc: '인지 자극 콘텐츠와 일상 루틴 관리를 원하는 분께 추천합니다.' },
  ],
  senior_care: [
    { label: '요양보호사·돌봄종사자', guideSlug: 'caregiver-pro', desc: '돌봄 업무 보조와 기록 자동화를 원하는 전문 돌봄 종사자에게 적합합니다.' },
    { label: '가족 보호자', guideSlug: 'family-caregiver', desc: '원격으로 부모님 건강을 확인하고 싶은 가족 돌봄자에게 추천합니다.' },
  ],
  rehabilitation: [
    { label: '뇌졸중 회복 환자', guideSlug: 'stroke-rehab', desc: '재활 운동 보조와 회복 진행 모니터링이 필요한 분께 적합합니다.' },
    { label: '요양병원·재활의학과', guideSlug: 'rehab-institution', desc: '다수 환자의 재활 훈련을 효율화하려는 의료기관에 추천합니다.' },
  ],
  monitoring: [
    { label: '노인 복지 담당 공무원', guideSlug: 'public-servant', desc: '지역 어르신 안전 확인 업무에 활용하려는 공무원에게 적합합니다.' },
    { label: '사회복지사', guideSlug: 'social-worker', desc: '케어 대상자 상태를 원격으로 파악하려는 복지사에게 추천합니다.' },
  ],
}

// ─────────────────────────────────────────
// generateStaticParams
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: robots.slug }).from(robots)
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// generateMetadata
// ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [robot] = await db
    .select()
    .from(robots)
    .where(eq(robots.slug, slug))
    .limit(1)

  if (!robot) {
    return { title: '로봇을 찾을 수 없습니다' }
  }

  const categoryLabel = CATEGORY_LABEL[robot.category] ?? robot.category
  const title = `${robot.name_ko} 완전 가이드 | 가격·기능·지원사업 총정리`
  const description =
    robot.description_short ??
    `${robot.name_ko}(${robot.manufacturer}) ${categoryLabel}의 가격, 주요 기능, 지자체 보급 현황을 한눈에 확인하세요.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: robot.hero_image_url ? [{ url: robot.hero_image_url }] : [],
    },
  }
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function RobotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // 로봇 기본 정보
  const [robot] = await db
    .select()
    .from(robots)
    .where(eq(robots.slug, slug))
    .limit(1)

  if (!robot) notFound()

  // 지자체 보급 현황
  const availabilities = await db
    .select({
      regionSlug: regions.slug,
      sidoName: regions.sido_name,
      sigunguName: regions.sigungu_name,
      distributionCount: robotRegionAvailability.distribution_count,
    })
    .from(robotRegionAvailability)
    .innerJoin(regions, eq(robotRegionAvailability.region_id, regions.id))
    .where(eq(robotRegionAvailability.robot_id, robot.id))

  // JSON-LD용 Robot 타입 매핑 (lib/jsonld은 src/types의 Robot 사용)
  const robotForJsonLd: Robot = {
    id: robot.id,
    slug: robot.slug,
    name_ko: robot.name_ko,
    name_en: robot.name_en ?? undefined,
    manufacturer: robot.manufacturer,
    category: robot.category,
    price_min: robot.price_min ?? undefined,
    price_max: robot.price_max ?? undefined,
    subscription_monthly: robot.subscription_monthly ?? undefined,
    description: robot.description_short ?? undefined,
    image_url: robot.hero_image_url ?? undefined,
  }

  const categoryLabel = CATEGORY_LABEL[robot.category] ?? robot.category
  const personaFits = PERSONA_MAP[robot.category] ?? []

  // FAQ
  const faqs = [
    {
      question: `${robot.name_ko}는 어디서 구매할 수 있나요?`,
      answer: `${robot.name_ko}는 ${robot.manufacturer} 공식 홈페이지 또는 공식 대리점을 통해 구매하실 수 있습니다. 지자체 지원사업을 통한 무료 보급·대여도 확인해 보세요.`,
    },
    {
      question: `${robot.name_ko}의 가격은 얼마인가요?`,
      answer: robot.price_min || robot.price_max
        ? `${robot.name_ko}의 구매 가격은 ${robot.price_min ? `${Math.floor(robot.price_min / 10000)}만원` : ''}${robot.price_min && robot.price_max ? ' ~ ' : ''}${robot.price_max ? `${Math.floor(robot.price_max / 10000)}만원` : ''} 수준입니다. 지자체 보조금이나 구독/대여 옵션도 있으니 확인해 보세요.`
        : `${robot.name_ko}의 정확한 가격은 ${robot.manufacturer} 공식 홈페이지 또는 판매처에 문의하시기 바랍니다.`,
    },
    {
      question: `${robot.name_ko}는 노인 혼자 사용할 수 있나요?`,
      answer: `${robot.name_ko}는 어르신이 단독으로 사용할 수 있도록 간단한 인터페이스로 설계되어 있습니다. 초기 설정은 가족 또는 복지사의 도움을 받는 것이 좋습니다.`,
    },
    {
      question: '지자체 지원사업을 통해 무료로 받을 수 있나요?',
      answer: `네, 일부 지자체에서는 독거 어르신·저소득 가구를 대상으로 ${robot.name_ko} 등 돌봄 로봇을 무료 보급하거나 저렴하게 대여하는 사업을 운영하고 있습니다. 해당 지역 주민센터나 복지관에 문의하거나, 아래 지자체 보급 현황을 확인하세요.`,
    },
    {
      question: `${robot.name_ko}는 치매 예방에 도움이 되나요?`,
      answer: `${CATEGORY_LABEL[robot.category] ?? robot.category}인 ${robot.name_ko}는 인지 자극 콘텐츠와 규칙적인 상호작용을 통해 인지 기능 유지에 도움을 줄 수 있습니다. 단, 의료적 효과는 개인차가 있으므로 의사와 상담하시기 바랍니다.`,
    },
    {
      question: 'AS(애프터서비스)는 어떻게 받나요?',
      answer: `${robot.name_ko}의 AS는 ${robot.manufacturer} 고객센터 또는 공식 서비스센터를 통해 받으실 수 있습니다. 구매 전 AS 정책과 보증 기간을 반드시 확인하세요.`,
    },
  ]

  // 출처
  const sources = [
    {
      type: 'official' as const,
      label: `${robot.manufacturer} 공식 홈페이지`,
      url: robot.manufacturer_url ?? undefined,
    },
    {
      type: 'government' as const,
      label: '보건복지부 노인돌봄정책 현황',
      url: 'https://www.mohw.go.kr',
    },
    {
      type: 'research' as const,
      label: '한국로봇산업진흥원 돌봄로봇 보급 현황 보고서',
      date: '2024',
    },
  ].filter((s) => s.label)

  // JSON-LD
  const productJsonLd = buildProductJsonLd(robotForJsonLd)
  const faqJsonLd = buildFAQJsonLd(faqs.map((f) => ({ q: f.question, a: f.answer })))
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '홈', url: `${SITE_URL}/` },
    { name: '돌봄 로봇', url: `${SITE_URL}/robot/` },
    { name: robot.name_ko, url: `${SITE_URL}/robot/${robot.slug}/` },
  ])

  const today = new Date().toISOString().split('T')[0]
  const nextUpdate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return (
    <>
      <JsonLdScript data={[productJsonLd, faqJsonLd, breadcrumbJsonLd]} />

      {/* 히어로 */}
      <RobotHero
        nameKo={robot.name_ko}
        nameEn={robot.name_en}
        manufacturer={robot.manufacturer}
        category={robot.category}
        priceMin={robot.price_min}
        priceMax={robot.price_max}
        subscriptionMonthly={robot.subscription_monthly}
        rentalAvailable={robot.rental_available}
        heroImageUrl={robot.hero_image_url}
      />

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-12">
        {/* 핵심 답변 */}
        <AnswerBlock>
          {robot.description_short ??
            `${robot.name_ko}는 ${robot.manufacturer}가 개발한 ${categoryLabel}으로, 어르신의 일상 지원과 안전 확인에 활용됩니다. 가격·기능·지원사업 정보를 아래에서 확인하세요.`}
        </AnswerBlock>

        {/* 주요 기능 */}
        <FeatureList featuresJson={robot.features_json} />

        {/* 가격 정보 */}
        <PricingTable
          priceMin={robot.price_min}
          priceMax={robot.price_max}
          subscriptionMonthly={robot.subscription_monthly}
          rentalAvailable={robot.rental_available}
          manufacturerUrl={robot.manufacturer_url}
        />

        {/* 적합 사용자 */}
        {personaFits.length > 0 && (
          <section aria-label="적합 사용자">
            <h2 className="text-xl font-bold text-gray-900 mb-4">이런 분께 적합합니다</h2>
            <ul className="flex flex-col gap-3">
              {personaFits.map((persona) => (
                <li
                  key={persona.guideSlug}
                  className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-5 py-4"
                >
                  <span className="text-2xl" aria-hidden="true">👤</span>
                  <div className="flex flex-col gap-1">
                    <a
                      href={`/guide/${persona.guideSlug}/`}
                      className="font-semibold text-blue-700 hover:underline text-sm"
                    >
                      {persona.label}
                    </a>
                    <p className="text-sm text-gray-600">{persona.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 지자체 보급 현황 */}
        <RegionalAvailability entries={availabilities} />

        {/* 비교 페이지 CTA */}
        <section
          aria-label="비교하기"
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-6 py-6 flex flex-col gap-3"
        >
          <h2 className="text-lg font-bold text-gray-900">다른 로봇과 비교해 보세요</h2>
          <p className="text-sm text-gray-600">
            {robot.name_ko}와 다른 돌봄 로봇을 가격·기능·지원 현황 기준으로 나란히 비교해 구매 결정에 도움을 받으세요.
          </p>
          <a
            href={`/compare/`}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors self-start"
          >
            로봇 비교 페이지 →
          </a>
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} />

        {/* 출처 */}
        <Sources sources={sources} />

        {/* 작성자 */}
        <AuthorBlock
          author={{
            name: '돌봄지기 편집팀',
            role: '돌봄로봇 전문 에디터',
            slug: 'editorial-team',
          }}
          confirmedAt={today}
          nextUpdateAt={nextUpdate}
        />
      </div>
    </>
  )
}
