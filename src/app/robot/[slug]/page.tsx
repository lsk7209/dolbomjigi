import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { robots } from '@/db/schema'
import { presentRobot } from '@/lib/product-evidence'
import { SITE_URL } from '@/lib/config'
import { buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'
import JsonLdScript from '@/components/seo/JsonLdScript'
import AuthorBlock from '@/components/common/AuthorBlock'
import EditorialRevision from '@/components/common/EditorialRevision'
import VerifiedFacts from '@/components/robot/VerifiedFacts'

export const dynamic = 'force-dynamic'
const loadRobot=cache(async(slug:string)=>{
 const row=await db.select().from(robots).where(eq(robots.slug,slug)).get()
 if(!row) notFound()
 return presentRobot(row)
})
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const robot=await loadRobot(slug)
 return {title:`${robot.name_ko}: 모델·비용·서비스 확인`,description:robot.description_short,alternates:{canonical:`${SITE_URL}/robot/${slug}`}}
}
export default async function RobotPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const robot=await loadRobot(slug)
 return <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-7">
  <JsonLdScript data={[buildProductJsonLd({id:robot.id,slug:robot.slug,name_ko:robot.name_ko,manufacturer:robot.manufacturer,category:robot.category,description:robot.description_short}),buildBreadcrumbJsonLd([{name:'홈',url:SITE_URL},{name:'제품',url:`${SITE_URL}/robot`},{name:robot.name_ko,url:`${SITE_URL}/robot/${slug}`}])]} />
  <nav className="text-sm"><Link href="/robot">제품 목록</Link> / {robot.name_ko}</nav>
  <h1 className="text-2xl font-bold">{robot.name_ko}: 모델·비용·서비스 확인</h1>
  <p className="text-gray-700 leading-relaxed">{robot.description_short}</p>
  <VerifiedFacts slug={slug}/>
  <EditorialRevision path={`/robot/${slug}`}/>
  <section className="flex flex-col gap-3"><h2 className="text-lg font-semibold">구매를 결정하기 전</h2><p>실제 모델의 설치·충전·통신 조건을 확인하고 어르신의 이용 의사를 먼저 물어보세요. 낙상 감지, 응급 연결, 치매 예방 기능은 제품별 검증 자료 없이 일반화할 수 없습니다. 돌봄 인력과 기존 연락 체계를 유지해야 합니다.</p><Link href="/guide/mom-living-alone" className="text-blue-700 underline">혼자 사는 부모님 돌봄 계획</Link><Link href="/compare" className="text-blue-700 underline">제품 비교</Link><Link href="/support" className="text-blue-700 underline">실제 지원 공고 확인</Link></section>
  <AuthorBlock author={{name:'돌봄지기 편집팀',role:'편집',slug:'editor-team'}}/>
 </main>
}
