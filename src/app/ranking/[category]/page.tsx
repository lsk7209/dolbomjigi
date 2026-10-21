import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/db/client'
import { robots } from '@/db/schema'
import { presentRobot } from '@/lib/product-evidence'
import { SITE_URL } from '@/lib/config'
import EditorialRevision from '@/components/common/EditorialRevision'

const categories:Record<string,string>={'best-value':'비용 비교','senior-friendly':'어르신 사용 조건','government-supported':'정부·지자체 지원 확인','companion':'반려·교감','senior-care':'어르신 돌봄','rehabilitation':'재활 분야','monitoring':'상태 확인'}
export const dynamic='force-dynamic'
export async function generateMetadata({params}:{params:Promise<{category:string}>}):Promise<Metadata>{const {category}=await params;if(!categories[category])notFound();return {title:`${categories[category]}: 돌봄로봇 후보 확인`,description:'실측 평가와 공식 지원 공고를 확인하기 전에는 점수·성능 순위를 부여하지 않습니다.',alternates:{canonical:`${SITE_URL}/ranking/${category}`}}}
export default async function RankingPage({params}:{params:Promise<{category:string}>}){
 const {category}=await params;if(!categories[category])notFound()
 const all=(await db.select().from(robots)).map(presentRobot)
 const selected:Record<string,string[]>={'senior-friendly':['hyodol','lovot','moflin'],companion:['lovot','moflin'],'senior-care':['hyodol']}
 const candidates=all.filter(r=>(selected[category]??[]).includes(r.slug)).sort((a,b)=>a.slug.localeCompare(b.slug))
 return <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
  <nav><Link href="/ranking">선택 기준 목록</Link></nav>
  <h1 className="text-2xl font-bold">{categories[category]}: 돌봄로봇 후보 확인</h1>
  <p>직접 사용 평가나 동일 조건의 성능 실험을 진행하지 않아 별점·추천 순위를 부여하지 않습니다. 아래 목록은 확인할 자료가 있는 제품을 영문 slug 순으로 나열합니다. 대여·국내 판매 기록·월 구독 존재는 친화성이나 지원 자격 점수가 아닙니다.</p>
  <EditorialRevision path={`/ranking/${category}`}/>
  {category==='government-supported'?<p className="rounded-lg bg-amber-50 p-4">현재 제품별 유효한 모집 공고·지원 조건의 연결 근거가 없어 지원 제품 추천을 표시하지 않습니다. 지원사업 자체가 없다는 뜻은 아닙니다. <Link href="/support" className="underline">지역·국가 공고 확인</Link></p>:<section><h2 className="text-lg font-semibold mb-4">추가 확인 후보</h2>{candidates.length===0&&<p>이 기준으로 추천할 충분한 모델별 비교 자료가 없어 제품을 임의로 채우지 않습니다.</p>}<ul className="flex flex-col gap-4">{candidates.map(r=><li key={r.id} className="border rounded-xl p-4"><Link href={`/robot/${r.slug}`} className="font-semibold text-blue-700 underline">{r.name_ko}</Link><p className="mt-2 text-sm">{r.description_short}</p></li>)}</ul></section>}
  <p className="text-sm">가성비는 같은 모델·시장·기간의 필수 비용과 설치·수리 조건을 비교해야 합니다. 어르신 친화성은 실제 조작·충전·소리·거부감·지원 가능 인력을 확인해야 합니다. 검증 자료가 부족한 제품으로 개수를 채우지 않습니다.</p>
 </main>
}
