import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { regions, supportPrograms } from '@/db/schema'
import EditorialRevision from '@/components/common/EditorialRevision'
import SupportProgramCards from '@/components/common/SupportProgramCards'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ sido: string }> }

async function findSido(slug: string) {
  const region = await db.select().from(regions).where(and(eq(regions.slug, slug), eq(regions.level, 'sido'))).get()
  if (!region) notFound()
  return region
}

export async function generateStaticParams() {
  const rows = await db.select({ slug: regions.slug }).from(regions).where(eq(regions.level, 'sido'))
  return rows.map((row) => ({ sido: row.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sido } = await params
  const region = await findSido(sido)
  return {
    title: `${region.sido_name} 돌봄로봇 지원사업 자료`,
    description: `${region.sido_name}에 연결된 기존 지원사업 자료와 현재 모집 확인 안내.`,
    alternates: { canonical: `${SITE_URL}/support/region/${sido}` },
  }
}

export default async function SidoSupportPage({ params }: Params) {
  const { sido } = await params
  const region = await findSido(sido)
  const children = await db.select({ id: regions.id, slug: regions.slug, name: regions.sigungu_name })
    .from(regions).where(and(eq(regions.level, 'sigungu'), eq(regions.sido_code, region.sido_code)))
    .orderBy(asc(regions.slug))
  const regionIds = [region.id, ...children.map((child) => child.id)]
  const programs = await db.select().from(supportPrograms)
    .where(and(inArray(supportPrograms.region_id, regionIds), eq(supportPrograms.human_reviewed, true)))
    .orderBy(asc(supportPrograms.name_ko), asc(supportPrograms.id))
  const linkedIds = new Set(programs.map((program) => program.region_id))
  const childLinks = children.filter((child) => linkedIds.has(child.id))
  const url = `${SITE_URL}/support/region/${sido}`

  return <>
    <JsonLdScript data={buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '지원사업', url: `${SITE_URL}/support` },
      { name: region.sido_name, url },
    ])} />
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
      <nav className="text-xs text-gray-500" aria-label="breadcrumb"><Link href="/">홈</Link> / <Link href="/support">지원사업</Link> / {region.sido_name}</nav>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{region.sido_name} 돌봄로봇 지원사업 자료</h1>
        <p className="text-sm text-gray-600">시도와 시군구에 연결된 편집 자료 {programs.length}건입니다. 현재 모집과 신청 조건은 사업별 공식 공고에서 확인하세요.</p>
      </header>
      {sido === 'seoul' && <EditorialRevision path="/support/region/seoul" />}
      {programs.length > 0 ? <SupportProgramCards programs={programs} /> : <p className="text-sm text-gray-600">등록된 검토 완료 사업 자료가 없습니다.</p>}
      {childLinks.length > 0 && <section className="flex flex-col gap-3" aria-label="시군구 자료">
        <h2 className="text-lg font-semibold">시군구별 자료</h2>
        <ul className="flex flex-wrap gap-3">{childLinks.map((child) => <li key={child.id}><Link className="text-blue-700 underline" href={`/support/region/${sido}/${child.slug}`}>{child.name ?? child.slug}</Link></li>)}</ul>
      </section>}
    </main>
  </>
}
