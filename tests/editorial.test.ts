import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { blogPosts } from '../src/db/schema'
import { contentVersion, explicitCandidates, matchingRegion, recruitmentLabel, hasExpertReview } from '../src/lib/trust'
import { reviewDecision, editorialState, structuralIssues, type EditorialEvidence } from '../src/lib/editorial-review'
import { actionEvent } from '../src/lib/action-events'
import { isPublicAt, publicAtOrBefore } from '../src/lib/publication'

const content={id:1,slug:'example',title_ko:'충전 방법',body_md:'## 충전 확인\n\n충전 단자와 설치 공간을 모델 설명서에서 확인합니다.'}
function evidence():EditorialEvidence{return {reviewer:'local-test-editor',contentVersion:contentVersion(content),reviewedAt:'2026-10-20',sources:[{url:'https://example.org/manual',claim:'model charging method',outcome:'matched',checkedAt:'2026-10-20'}],answersTitle:true,distinctContribution:true,noInventedExperience:true,productRegionPeriodMatch:true,medicalClaimsReviewed:false}}
test('one explicit candidate stays one, no TOP3 filler',()=>assert.equal(explicitCandidates([{id:1},{id:2},{id:3}],[1]).length,1))
test('date-only edits do not change semantic version or renew approval',()=>assert.equal(contentVersion({...content,updated_at:1,published_at:1}),contentVersion({...content,updated_at:2,published_at:2})))
test('changed price invalidates previous expert review',()=>{
 const old=contentVersion({price:1}), current=contentVersion({price:2})
 assert.equal(hasExpertReview({personVerified:true,credentialsVerified:true,participationEvidence:'record',expertReviewedAt:'2026-10-20',reviewedContentVersion:old},current),false)
})
test('source failure remains unapproved without a successful check date',()=>{
 const e=evidence();e.sources[0].outcome='failed';delete e.sources[0].checkedAt
 assert.equal(reviewDecision(content,e).approved,false)
 assert.equal('source_checked_at' in content,false)
})
test('old active program is unknown, ended intake is separate from operating service',()=>{
 assert.match(recruitmentLabel({status:'active',period_end:null}),/확인 필요/)
 assert.match(recruitmentLabel({status:'active',period_end:new Date('2024-01-01')}),/모집 기간 종료.*사업 운영 여부 별도/)
})
test('wrong province cannot resolve a child region',()=>assert.equal(matchingRegion({level:'sido',sido_code:'11'},{level:'sigungu',sido_code:'26'}),false))
test('length and tables cannot approve duplicated or source-free drafts',()=>{
 assert.equal(reviewDecision({...content,body_md:'반복 '.repeat(3000)}).approved,false)
 assert.deepEqual(structuralIssues('## 제목\n\n## 제목'),['duplicate-heading'])
 const e=evidence();e.distinctContribution=false
 assert.equal(reviewDecision(content,e).approved,false)
})
test('states distinguish approved version, schedule and content change',()=>{
 const v=contentVersion(content), date=new Date('2030-01-01')
 assert.equal(editorialState(null,null,v),'draft')
 assert.equal(editorialState(null,v,v),'approved')
 assert.equal(editorialState(date,v,v,new Date('2029-01-01')),'scheduled')
 assert.equal(editorialState(date,v,v,new Date('2030-01-01')),'public')
 assert.equal(editorialState(date,'old',v),'review-pending')
})
test('future legacy schedules never become public solely because time elapsed',()=>assert.equal(isPublicAt(new Date('2030-01-01'),new Date('2031-01-01')),false))

test('new rows cannot bypass editorial approval by backdating publication',()=>{
 assert.equal(isPublicAt(new Date('2024-01-01'),new Date('2026-10-20'),{id:999999,slug:'new-backdated-draft',body_md:'not reviewed'},'blog_posts'),false)
})
test('version-approved schedule changes visibility at exact UTC/KST boundary',()=>{
 const allowed=[{table:'blog_posts',values:content,version:contentVersion(content)}]
 const date=new Date('2030-01-01T00:00:00+09:00')
 assert.equal(isPublicAt(date,new Date('2029-12-31T14:59:59Z'),content,'blog_posts',allowed),false)
 assert.equal(isPublicAt(date,new Date('2029-12-31T15:00:00Z'),content,'blog_posts',allowed),true)
 assert.equal(isPublicAt(date,new Date('2031-01-01'),{...content,title_ko:'changed'},'blog_posts',allowed),false)
})
test('SQL approval matches exact semantic fields, rejects body mutation',async()=>{
 const client=createClient({url:':memory:'});try{
 await client.execute('create table blog_posts (id integer,slug text,title_ko text,body_md text,published_at integer)')
 await client.execute({sql:'insert into blog_posts values (?,?,?,?,?)',args:[1,content.slug,content.title_ko,content.body_md,1893456000]})
 const db=drizzle(client),allowed=[{table:'blog_posts',values:content,version:contentVersion(content)}]
 const query=()=>db.select({slug:blogPosts.slug}).from(blogPosts).where(publicAtOrBefore(blogPosts.published_at,new Date('2031-01-01'),allowed))
 assert.equal((await query()).length,1)
 await client.execute("update blog_posts set body_md='unapproved edit'")
 assert.equal((await query()).length,0)
 }finally{client.close()}
})
test('one action has one fixed event and no query, href or personal data',()=>{
 assert.deepEqual(actionEvent('product_official_open','/robot/lovot'),{name:'dolbom_product_official_open',params:{page_path:'/robot/lovot'}})
 assert.equal(actionEvent('inquiry_completed','/contact'),null)
 assert.equal(actionEvent('product_official_open','/robot/lovot?email=private'),null)
})
