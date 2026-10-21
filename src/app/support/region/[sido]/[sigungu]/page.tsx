import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { regions, supportPrograms } from '@/db/schema'
import SupportProgramCards from '@/components/common/SupportProgramCards'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'
import { matchingRegion } from '@/lib/trust'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ sido: string; sigungu: string }> }

async function findRegion(sido: string, sigungu: string) {
  const [parent, child] = await Promise.all([
    db.select().from(regions).where(and(eq(regions.slug, sido), eq(regions.level, 'sido'))).get(),
    db.select().from(regions).where(and(eq(regions.slug, sigungu), eq(regions.level, 'sigungu'))).get(),
  ])
  if (!matchingRegion(parent, child) || !child) notFound()
  return child
}

export async function generateStaticParams() {
  const [sidos, sigungus, programs] = await Promise.all([
    db.select({ slug: regions.slug, sido_code: regions.sido_code }).from(regions).where(eq(regions.level, 'sido')),
    db.select({ id: regions.id, slug: regions.slug, sido_code: regions.sido_code }).from(regions).where(eq(regions.level, 'sigungu')),
    db.select({ region_id: supportPrograms.region_id }).from(supportPrograms).where(eq(supportPrograms.human_reviewed, true)),
  ])
  const sidoByCode = new Map(sidos.map((sido) => [sido.sido_code, sido.slug]))
  const reviewedIds = new Set(programs.map((program) => program.region_id))
  return sigungus.filter((region) => reviewedIds.has(region.id) && sidoByCode.has(region.sido_code))
    .map((region) => ({ sido: sidoByCode.get(region.sido_code)!, sigungu: region.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sido, sigungu } = await params
  const region = await findRegion(sido, sigungu)
  return {
    title: `${region.sigungu_name ?? region.sido_name} 돌봄로봇 지원사업 자료`,
    description: `${region.sigungu_name ?? region.sido_name}에 연결된 기존 지원사업 자료와 현재 모집 확인 안내.`,
    alternates: { canonical: `${SITE_URL}/support/region/${sido}/${sigungu}` },
  }
}

export default async function SigunguSupportPage({ params }: Params) {
  const { sido, sigungu } = await params
  const region = await findRegion(sido, sigungu)
  const programs = await db.select().from(supportPrograms)
    .where(and(eq(supportPrograms.region_id, region.id), eq(supportPrograms.human_reviewed, true)))
    .orderBy(asc(supportPrograms.name_ko), asc(supportPrograms.id))
  if (programs.length === 0) notFound()

  const url = `${SITE_URL}/support/region/${sido}/${sigungu}`
  return <>
    <JsonLdScript data={buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '지원사업', url: `${SITE_URL}/support` },
      { name: region.sido_name, url: `${SITE_URL}/support/region/${sido}` },
      { name: region.sigungu_name ?? region.sido_name, url },
    ])} />
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
      <nav className="text-xs text-gray-500" aria-label="breadcrumb">
        <Link href="/">홈</Link> / <Link href="/support">지원사업</Link> / <Link href={`/support/region/${sido}`}>{region.sido_name}</Link> / {region.sigungu_name}
      </nav>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{region.sigungu_name ?? region.sido_name} 돌봄로봇 지원사업 자료</h1>
        <p className="text-sm text-gray-600">연결된 편집 자료 {programs.length}건입니다. 각 사업의 현재 모집, 자격, 비용과 접수 창구는 해당 연도의 원문 공고에서 확인하세요.</p>
      </header>
      <SupportProgramCards programs={programs} />
    </main>
  </>
}
