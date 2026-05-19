import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { guides, robots, authors } from '@/db/schema'

import JsonLdScript from '@/components/seo/JsonLdScript'
import AnswerBlock from '@/components/common/AnswerBlock'
import FAQSection from '@/components/common/FAQSection'
import Sources from '@/components/common/Sources'
import AuthorBlock from '@/components/common/AuthorBlock'

import { buildArticleJsonLd, buildFAQJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────
type Guide = typeof guides.$inferSelect
type Robot = typeof robots.$inferSelect
type Author = typeof authors.$inferSelect

// ─────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────
const PERSONA_LABEL: Record<string, string> = {
  family_caregiver: '가족 돌봄자',
  social_worker: '사회복지사',
  public_servant: '복지 담당 공무원',
  institution: '요양기관·시설',
}

const PERSONA_DESC: Record<string, string> = {
  family_caregiver:
    '부모님·배우자 등 가족을 직접 돌보거나 원격으로 안전을 확인하고자 하는 가족 돌봄자',
  social_worker:
    '케어 대상자를 담당하며 돌봄 로봇 도입을 검토하는 사회복지사·요양보호사',
  public_servant:
    '지역 독거 노인 안전 확인 및 돌봄 로봇 보급사업을 담당하는 공무원·복지담당자',
  institution:
    '요양원·주간보호센터·재활병원 등 다수의 노인을 돌보는 기관 담당자',
}

const CATEGORY_LABEL: Record<string, string> = {
  companion: '반려·동행',
  senior_care: '노인돌봄',
  rehabilitation: '재활',
  monitoring: '모니터링',
}

function parseRecommendedRobots(json: string | null | undefined): number[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : []
  } catch {
    return []
  }
}

function formatPrice(amount: number): string {
  const man = Math.floor(amount / 10000)
  return `${man.toLocaleString()}만원`
}

// ─────────────────────────────────────────
// generateStaticParams
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: guides.slug }).from(guides)
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
  const [guide] = await db
    .select()
    .from(guides)
    .where(eq(guides.slug, slug))
    .limit(1)

  if (!guide) return { title: '가이드를 찾을 수 없습니다' }

  const personaLabel = PERSONA_LABEL[guide.persona_group] ?? guide.persona_group
  const title = `${guide.title_ko} | ${personaLabel} 돌봄로봇 선택 가이드`
  const description = guide.scenario
    ? `${guide.scenario} — ${personaLabel}를 위한 돌봄 로봇 선택 가이드.`
    : `${personaLabel}를 위한 돌봄 로봇 선택 및 지원사업 활용 완전 가이드.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [guide] = await db
    .select()
    .from(guides)
    .where(eq(guides.slug, slug))
    .limit(1)

  if (!guide) notFound()

  // 작성자·감수자 조회
  let authorData: Author | undefined
  let reviewerData: Author | undefined

  if (guide.author_id) {
    const [a] = await db.select().from(authors).where(eq(authors.id, guide.author_id)).limit(1)
    authorData = a
  }
  if (guide.reviewer_id) {
    const [r] = await db.select().from(authors).where(eq(authors.id, guide.reviewer_id)).limit(1)
    reviewerData = r
  }

  // 추천 로봇 조회
  const recommendedIds = parseRecommendedRobots(guide.recommended_robots_json)
  let recommendedRobots: Robot[] = []
  if (recommendedIds.length > 0) {
    // 추천 로봇 ID 목록으로 조회
    const allRobots = await db.select().from(robots)
    recommendedRobots = allRobots
      .filter((r) => recommendedIds.includes(r.id))
      .sort((a, b) => recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id))
      .slice(0, 3)
  }

  // 추천 로봇이 부족하면 같은 페르소나에 맞는 기본 로봇으로 보완
  if (recommendedRobots.length < 3) {
    const fallbackCategory =
      guide.persona_group === 'family_caregiver' || guide.persona_group === 'social_worker'
        ? 'senior_care'
        : guide.persona_group === 'public_servant'
        ? 'monitoring'
        : 'companion'

    const fallbacks = await db
      .select()
      .from(robots)
      .where(eq(robots.category, fallbackCategory as 'companion' | 'senior_care' | 'rehabilitation' | 'monitoring'))

    const existingIds = new Set(recommendedRobots.map((r) => r.id))
    for (const r of fallbacks) {
      if (!existingIds.has(r.id)) {
        recommendedRobots.push(r)
        if (recommendedRobots.length >= 3) break
      }
    }
  }

  const personaLabel = PERSONA_LABEL[guide.persona_group] ?? guide.persona_group
  const personaDesc = PERSONA_DESC[guide.persona_group] ?? ''

  // FAQ (가이드별 기본 FAQ)
  const faqs = [
    {
      question: `${personaLabel}에게 가장 적합한 돌봄 로봇은 무엇인가요?`,
      answer: `${personaLabel}의 상황에 따라 다르지만, 일반적으로 ${guide.persona_group === 'family_caregiver' ? '원격 모니터링과 긴급 알림 기능이 강한' : guide.persona_group === 'social_worker' ? '다수 케어 대상자를 효율적으로 관리할 수 있는' : guide.persona_group === 'public_servant' ? '대규모 보급과 관리가 용이한' : '다수 입소자에게 적용 가능한'} 로봇이 적합합니다. 위의 추천 로봇을 참고하세요.`,
    },
    {
      question: '돌봄 로봇 도입 비용이 부담스럽습니다. 지원사업을 받을 수 있나요?',
      answer: '보건복지부와 지자체에서 독거 어르신, 저소득 가구, 복지시설 등을 대상으로 돌봄 로봇 무상 보급 또는 구매 보조금 지원사업을 운영하고 있습니다. 지역 주민센터·복지관 또는 이 사이트의 지원사업 페이지에서 확인하세요.',
    },
    {
      question: '돌봄 로봇을 어르신이 혼자 사용할 수 있나요?',
      answer: '대부분의 국내 돌봄 로봇은 어르신이 단독으로 사용할 수 있도록 간단한 터치 인터페이스나 음성 인식 방식으로 설계되어 있습니다. 초기 설정 및 앱 연동은 가족이나 복지사의 도움이 필요할 수 있습니다.',
    },
    {
      question: '돌봄 로봇 도입 전 어떤 점을 확인해야 하나요?',
      answer: 'Wi-Fi 연결 환경, 충전 위치, 낙상 감지 범위, AS 정책, 월 구독 여부 등을 사전에 확인하세요. 가능하다면 체험·대여 프로그램을 통해 실제 사용성을 먼저 확인하는 것을 권장합니다.',
    },
    {
      question: '가이드 내용은 얼마나 자주 업데이트되나요?',
      answer: '이 가이드는 최소 분기(3개월)마다 최신 제품 정보와 지원사업 현황을 반영하여 업데이트됩니다. 정확한 최신 내용은 각 기관에 직접 문의하시기 바랍니다.',
    },
  ]

  // 예산대별 옵션
  const priceTiers = [
    {
      tier: '무료 (지원사업)',
      condition: '독거 어르신·저소득 가구 해당 시',
      robots: recommendedRobots.filter((r) => r.rental_available || !r.price_min),
      note: '지자체 지원사업 통한 무상 보급',
    },
    {
      tier: '50만원 미만',
      condition: '저가 구독형 또는 소형 기기',
      robots: recommendedRobots.filter((r) => r.price_min && r.price_min < 500000),
      note: '월정액 구독 서비스 포함',
    },
    {
      tier: '50~200만원',
      condition: '중간 가격대 보급형',
      robots: recommendedRobots.filter(
        (r) => r.price_min && r.price_min >= 500000 && r.price_min < 2000000
      ),
      note: '기능·가격 균형이 좋은 구간',
    },
    {
      tier: '200만원 이상',
      condition: '프리미엄·전문가용',
      robots: recommendedRobots.filter((r) => r.price_min && r.price_min >= 2000000),
      note: '고기능 재활·전문 돌봄 로봇',
    },
  ].filter((tier) => tier.robots.length > 0 || tier.tier === '무료 (지원사업)')

  // JSON-LD
  const publishedAt = guide.published_at
    ? guide.published_at.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const articleJsonLd = buildArticleJsonLd({
    title: guide.title_ko,
    description: guide.scenario ?? `${personaLabel} 대상 돌봄 로봇 선택 가이드`,
    datePublished: publishedAt,
    dateModified: today,
    authorName: authorData?.name ?? '돌봄지기 편집팀',
    url: `https://dolbomjigi.com/guide/${guide.slug}/`,
  })

  const faqJsonLd = buildFAQJsonLd(faqs.map((f) => ({ q: f.question, a: f.answer })))

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '홈', url: 'https://dolbomjigi.com/' },
    { name: '가이드', url: 'https://dolbomjigi.com/guide/' },
    { name: guide.title_ko, url: `https://dolbomjigi.com/guide/${guide.slug}/` },
  ])

  const nextUpdate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return (
    <>
      <JsonLdScript data={[articleJsonLd, faqJsonLd, breadcrumbJsonLd]} />

      {/* 헤더 */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-gray-700">홈</a>
            {' > '}
            <a href="/guide/" className="hover:text-gray-700">가이드</a>
            {' > '}
            <span className="text-gray-600">{personaLabel}</span>
          </nav>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1 font-semibold">
              {personaLabel} 가이드
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            {guide.title_ko}
          </h1>
          {guide.scenario && (
            <p className="mt-2 text-sm text-gray-500">{guide.scenario}</p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-12">
        {/* 1. 페르소나 정의 박스 */}
        <section aria-label="페르소나 정의">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5 flex flex-col gap-2">
            <h2 className="font-bold text-blue-900 text-base">
              {personaLabel}란?
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{personaDesc}</p>
            {guide.scenario && (
              <p className="text-xs text-blue-700 mt-1">
                이 가이드 시나리오: {guide.scenario}
              </p>
            )}
          </div>
        </section>

        {/* 2. 핵심 답변 */}
        <AnswerBlock>
          {guide.body_md.slice(0, 250)}
        </AnswerBlock>

        {/* 3. 필요 기능 분석 */}
        <section aria-label="필요 기능 분석">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {personaLabel}에게 필요한 기능
          </h2>
          <ul className="flex flex-col gap-3">
            {getNeedsAnalysis(guide.persona_group).map((need, index) => (
              <li
                key={index}
                className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3"
              >
                <span className="text-blue-500 font-bold text-lg" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{need.feature}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{need.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. 추천 로봇 TOP 3 */}
        {recommendedRobots.length > 0 && (
          <section aria-label="추천 로봇">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {personaLabel} 추천 로봇 TOP {Math.min(3, recommendedRobots.length)}
            </h2>
            <ol className="flex flex-col gap-4">
              {recommendedRobots.map((robot, index) => (
                <li key={robot.id}>
                  <a
                    href={`/robot/${robot.slug}/`}
                    className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-400 text-white'
                          : index === 1
                          ? 'bg-gray-300 text-white'
                          : 'bg-orange-300 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{robot.name_ko}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {CATEGORY_LABEL[robot.category] ?? robot.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{robot.manufacturer}</p>
                      {robot.description_short && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {robot.description_short}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {robot.price_min ? (
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(robot.price_min)}~
                        </p>
                      ) : robot.subscription_monthly ? (
                        <p className="text-sm font-bold text-blue-700">
                          {formatPrice(robot.subscription_monthly)}/월
                        </p>
                      ) : null}
                      <span className="text-xs text-blue-600">자세히 →</span>
                    </div>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 5. 예산대별 옵션 */}
        <section aria-label="예산대별 옵션">
          <h2 className="text-xl font-bold text-gray-900 mb-4">예산대별 선택 가이드</h2>
          <div className="flex flex-col gap-3">
            {priceTiers.map((tier) => (
              <div
                key={tier.tier}
                className="bg-white border border-gray-100 rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-sm">{tier.tier}</span>
                  <span className="text-xs text-gray-400">({tier.condition})</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{tier.note}</p>
                {tier.robots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tier.robots.map((r) => (
                      <a
                        key={r.slug}
                        href={`/robot/${r.slug}/`}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
                      >
                        {r.name_ko}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">해당 가격대 제품 준비 중</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. 지원사업 힌트 */}
        <section
          aria-label="지원사업 안내"
          className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 flex flex-col gap-3"
        >
          <h2 className="text-lg font-bold text-amber-900">지원사업 활용하기</h2>
          <p className="text-sm text-gray-700">
            보건복지부와 지자체에서는 독거 어르신, 저소득 가구, 복지시설 등을 대상으로
            돌봄 로봇 무상 보급·구매 보조금·대여 지원사업을 운영하고 있습니다.
            {personaLabel === '가족 돌봄자' &&
              ' 가족이 돌봄을 받고 있는 경우 지역 주민센터·복지관에 신청 가능합니다.'}
            {personaLabel === '사회복지사' &&
              ' 케어 대상자의 거주 지역 지원사업을 함께 확인해 드릴 수 있습니다.'}
            {personaLabel === '복지 담당 공무원' &&
              ' 보급사업 예산 신청 및 운영 현황은 아래 지원사업 목록을 참고하세요.'}
            {personaLabel === '요양기관·시설' &&
              ' 기관 단위 도입 지원제도가 별도로 있습니다. 지원사업 페이지를 확인하세요.'}
          </p>
          <a
            href="/support/"
            className="inline-flex items-center gap-1.5 bg-amber-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors self-start"
          >
            지원사업 찾아보기 →
          </a>
        </section>

        {/* 7. FAQ */}
        <FAQSection faqs={faqs} />

        {/* 8. 출처 */}
        <Sources
          sources={[
            {
              type: 'government',
              label: '보건복지부 노인돌봄 정책',
              url: 'https://www.mohw.go.kr',
            },
            {
              type: 'government',
              label: '한국로봇산업진흥원 돌봄로봇 보급 현황',
              url: 'https://www.korearobot.or.kr',
            },
            {
              type: 'research',
              label: '과학기술정책연구원 AI·로봇 돌봄 서비스 연구',
              date: '2024',
            },
          ]}
        />

        {/* 9. 작성자·감수자 (T3 필수) */}
        <AuthorBlock
          author={
            authorData
              ? {
                  name: authorData.name,
                  role: authorData.role,
                  slug: authorData.slug,
                }
              : {
                  name: '돌봄지기 편집팀',
                  role: '돌봄로봇 전문 에디터',
                  slug: 'editorial-team',
                }
          }
          reviewer={
            reviewerData
              ? {
                  name: reviewerData.name,
                  credentials: reviewerData.role,
                  slug: reviewerData.slug,
                }
              : {
                  name: '김복지',
                  credentials: '사회복지사 1급 · 노인복지전문가',
                  slug: 'kim-bokji',
                }
          }
          confirmedAt={today}
          nextUpdateAt={nextUpdate}
        />
      </div>
    </>
  )
}

// ─────────────────────────────────────────
// 페르소나별 필요 기능 분석
// ─────────────────────────────────────────
function getNeedsAnalysis(
  personaGroup: string
): { feature: string; reason: string }[] {
  const map: Record<string, { feature: string; reason: string }[]> = {
    family_caregiver: [
      {
        feature: '원격 모니터링',
        reason: '자녀가 멀리 살더라도 부모님 상태를 실시간으로 확인할 수 있습니다.',
      },
      {
        feature: '낙상 감지 및 긴급 알림',
        reason: '독거 어르신 낙상 사고를 즉시 가족에게 알려 신속한 대응이 가능합니다.',
      },
      {
        feature: '약 복용 알림',
        reason: '만성질환을 가진 어르신의 약 복용 시간을 놓치지 않도록 도와줍니다.',
      },
      {
        feature: '간단한 조작 인터페이스',
        reason: '디지털 기기에 익숙하지 않은 어르신도 혼자 사용할 수 있어야 합니다.',
      },
    ],
    social_worker: [
      {
        feature: '다중 케어 대상자 관리',
        reason: '여러 케어 대상자의 상태를 한 앱에서 효율적으로 관리할 수 있어야 합니다.',
      },
      {
        feature: '케어 기록 자동화',
        reason: '방문 기록, 건강 지표 등을 자동으로 저장하여 업무 부담을 줄여줍니다.',
      },
      {
        feature: '지자체 시스템 연동',
        reason: '복지 시스템과 데이터 연동이 가능하면 행정 업무가 크게 단순화됩니다.',
      },
      {
        feature: '안정적인 A/S',
        reason: '케어 현장에서 기기 문제가 생겼을 때 신속한 기술 지원이 필요합니다.',
      },
    ],
    public_servant: [
      {
        feature: '대규모 보급 적합성',
        reason: '지자체 단위 보급사업에서 대량 구매 및 일괄 설정이 가능해야 합니다.',
      },
      {
        feature: '독거 어르신 안전 확인',
        reason: '정기적 안전 확인 업무를 로봇이 부분적으로 대체할 수 있습니다.',
      },
      {
        feature: '공공 데이터 연동',
        reason: '행정안전부·복지로 시스템과 연동하면 업무 효율성이 높아집니다.',
      },
      {
        feature: '합리적인 단가',
        reason: '예산 제약이 있는 공공사업에서 경제적인 단가가 중요합니다.',
      },
    ],
    institution: [
      {
        feature: '다수 입소자 동시 대응',
        reason: '요양원·주간보호센터 등에서 여러 어르신을 동시에 돌볼 수 있어야 합니다.',
      },
      {
        feature: '재활·인지 자극 콘텐츠',
        reason: '입소자의 신체·인지 기능 유지를 위한 전문 콘텐츠가 탑재되어야 합니다.',
      },
      {
        feature: '기관 관리 시스템',
        reason: '기관 단위로 여러 로봇을 중앙에서 관리할 수 있는 대시보드가 필요합니다.',
      },
      {
        feature: '위생 및 내구성',
        reason: '요양 환경에서 사용하므로 청결 유지와 내구성이 중요합니다.',
      },
    ],
  }

  return map[personaGroup] ?? []
}
