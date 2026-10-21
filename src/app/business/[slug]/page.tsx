import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { robots } from '@/db/schema'
import EditorialRevision from '@/components/common/EditorialRevision'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

const BUSINESS_TYPES = {
  'nursing-home': {
    name: '요양원',
    category: 'senior_care' as const,
    summary: '요양원에서 돌봄로봇을 검토할 때 비용, 개인정보, 직원 교육, 사고 대응과 종료 조건을 확인하는 안내입니다.',
  },
  'welfare-center': {
    name: '복지관',
    category: 'companion' as const,
    summary: '복지관 프로그램에 돌봄로봇을 도입할 때 담당자, 예산, 참여자 동의와 운영 기록을 확인하는 안내입니다.',
  },
}

type Params = { params: Promise<{ slug: string }> }
type BusinessSlug = keyof typeof BUSINESS_TYPES

function getBusiness(slug: string) {
  if (!(slug in BUSINESS_TYPES)) notFound()
  return BUSINESS_TYPES[slug as BusinessSlug]
}

export function generateStaticParams() {
  return Object.keys(BUSINESS_TYPES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const business = getBusiness(slug)
  return {
    title: `${business.name} 돌봄로봇 도입 가이드`,
    description: business.summary,
    alternates: { canonical: `${SITE_URL}/business/${slug}` },
  }
}

export default async function BusinessPage({ params }: Params) {
  const { slug } = await params
  const business = getBusiness(slug)
  const catalog = await db.select({ id: robots.id, slug: robots.slug, name: robots.name_ko })
    .from(robots).where(eq(robots.category, business.category))
    .orderBy(asc(robots.name_ko), asc(robots.id))
  const url = `${SITE_URL}/business/${slug}`

  return <>
    <JsonLdScript data={buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '기관 도입 가이드', url: `${SITE_URL}/business` },
      { name: business.name, url },
    ])} />
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
      <nav className="text-xs text-gray-500" aria-label="breadcrumb"><Link href="/">홈</Link> / <Link href="/business">기관 도입 가이드</Link> / {business.name}</nav>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{business.name} 돌봄로봇 도입 가이드</h1>
        <p className="text-sm text-gray-600">{business.summary}</p>
      </header>
      <section className="flex flex-col gap-4" aria-label="도입 전 점검">
        <h2 className="text-lg font-semibold">도입 전 확인할 항목</h2>
        <ul className="list-disc pl-5 text-sm leading-7 text-gray-700">
          <li>기기 가격, 설치, 통신, 유지보수, 소모품, 해지 비용을 견적서에서 구분해 총예산을 계산합니다.</li>
          <li>촬영·음성·건강 정보가 있다면 수집 범위와 보관 기간을 확인하고 참여자와 보호자의 동의 절차를 마련합니다.</li>
          <li>직원에게 사용법과 한계를 교육하고, 담당자 부재 시 대응자를 정합니다.</li>
          <li>오작동, 낙상 알림 누락, 개인정보 사고 시 신고·기록·연락 순서를 정합니다.</li>
          <li>시범 운영의 중단 기준, 데이터 삭제, 반납과 계약 종료 절차를 미리 확인합니다.</li>
        </ul>
      </section>
      {slug === 'welfare-center' && <EditorialRevision path="/guide/welfare-center-coordinator" />}
      <section className="flex flex-col gap-3" aria-label="제품 목록">
        <h2 className="text-lg font-semibold">검토할 수 있는 제품 목록</h2>
        <p className="text-sm text-gray-600">아래는 분류에 따른 목록입니다. 기관 적합성, 가격과 계약 조건은 각 제품의 최신 공식 자료로 확인하세요.</p>
        {catalog.length > 0 ? <ul className="flex flex-wrap gap-3">{catalog.map((robot) => <li key={robot.id}><Link href={`/robot/${robot.slug}`} className="text-blue-700 underline">{robot.name}</Link></li>)}</ul> : <p className="text-sm text-gray-600">등록된 제품이 없습니다.</p>}
      </section>
      <p className="text-sm text-gray-600">지원사업은 기관 유형만으로 참여 자격을 판단할 수 없습니다. <Link href="/support" className="text-blue-700 underline">지원사업 자료</Link>에서 원문 공고와 신청 주체를 확인하세요.</p>
    </main>
  </>
}
