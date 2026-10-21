import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { supportPrograms } from '@/db/schema'
import SupportProgramCards from '@/components/common/SupportProgramCards'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

async function findProgram(slug: string) {
  const program = await db.select().from(supportPrograms)
    .where(and(eq(supportPrograms.slug, slug), isNull(supportPrograms.region_id), eq(supportPrograms.human_reviewed, true)))
    .get()
  if (!program) notFound()
  return program
}

export async function generateStaticParams() {
  const programs = await db.select({ slug: supportPrograms.slug }).from(supportPrograms)
    .where(and(isNull(supportPrograms.region_id), eq(supportPrograms.human_reviewed, true)))
  return programs.map((program) => ({ slug: program.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const program = await findProgram(slug)
  return {
    title: `${program.name_ko} | 국가 단위 돌봄로봇 지원사업 자료`,
    description: `${program.name_ko}의 기존 등록 자료와 현재 모집 확인 안내.`,
    alternates: { canonical: `${SITE_URL}/support/national/${slug}` },
  }
}

export default async function NationalSupportPage({ params }: Params) {
  const { slug } = await params
  const program = await findProgram(slug)
  const url = `${SITE_URL}/support/national/${slug}`
  return <>
    <JsonLdScript data={buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '지원사업', url: `${SITE_URL}/support` },
      { name: program.name_ko, url },
    ])} />
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
      <nav className="text-xs text-gray-500" aria-label="breadcrumb"><Link href="/">홈</Link> / <Link href="/support">지원사업</Link> / {program.name_ko}</nav>
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{program.name_ko}</h1>
        <p className="text-sm text-gray-600">기존에 등록된 국가 단위 사업 자료입니다. 현재 모집과 신청 조건은 해당 연도의 공식 공고를 확인하세요.</p>
      </header>
      <SupportProgramCards programs={[program]} />
    </main>
  </>
}
