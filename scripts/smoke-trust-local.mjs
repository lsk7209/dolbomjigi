// Read-only HTTP verification; deliberately accepts only this task's loopback server.
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
const base='http://127.0.0.1:3210'
const productionDefault=process.argv.includes('--production-default')
const snapshot=JSON.parse(await readFile('.goal-harness/local-data/public-snapshot.json','utf8'))
const future=snapshot.tables.blog_posts.filter(row=>row.published_at>Date.parse(snapshot.capturedAt)/1000)
const checked=[]
async function get(path,status=200) {
  const response=await fetch(base+path,{headers:{'User-Agent':'Googlebot'},signal:AbortSignal.timeout(15000)})
  const body=await response.text()
  assert.equal(response.status,status,path)
  if(!productionDefault) assert.doesNotMatch(body,/<script[^>]+src=["'][^"']*(?:googletagmanager|googlesyndication)/i,`Preview telemetry: ${path}`)
  checked.push({path,status:response.status})
  return {response,body}
}
for(const route of ['/', '/robot','/robot/lovot','/robot/moflin','/robot/hyodol','/compare','/compare/lovot-vs-moflin','/guide/mom-living-alone','/guide/welfare-center-coordinator','/ranking/senior-friendly','/ranking/government-supported','/support','/support/region/seoul','/support/region/jeju/jeju-jeju-si','/support/national/mohw-2024-national-care-robot','/authors','/authors/editor-team','/blog']) await get(route)
const {body:unverifiedComparison}=await get('/compare/hyodol-vs-dasom-k')
assert.ok(unverifiedComparison.includes('현재 모델별 기능·요금·지원사업 연결 근거를 대조하기 전입니다.'))
for(const slug of ['lovot-real-user-experience','hyodol-monthly-fee-breakdown','hyodol-vs-dasom-comparison']) {
  const {body}=await get(`/blog/${slug}`)
  assert.match(body,new RegExp(`rel="canonical" href="https://dolbomjigi.ehon365.kr/blog/${slug}"`))
  assert.doesNotMatch(body,/editorial-note\/all-robot-profiles/)
  if(productionDefault) {
    const stored=snapshot.tables.blog_posts.find(row=>row.slug===slug)
    assert.ok(stored,`Missing original blog: ${slug}`)
    assert.equal(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1],escapeHtml(stored.title_ko),`Original blog title: ${slug}`)
  }
}
function escapeHtml(value) {return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;')}
if(productionDefault) {
  const revisions=JSON.parse(await readFile('src/content/revisions.json','utf8'))
  for(const [path,manuscript] of Object.entries(revisions)) {
    const {body}=await get(path)
    const heading=manuscript.split('\n',1)[0].replace(/^## /,'')
    const renderedHeadings=[...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(match=>match[1])
    assert.ok(!renderedHeadings.includes(escapeHtml(heading)),`Unapproved manuscript: ${path}`)
    if(!path.startsWith('/blog/')) assert.ok(body.includes('이 항목은 자료 대조 중입니다.'),`Production editorial fallback: ${path}`)
  }
  const {body}=await get('/business/welfare-center')
  assert.ok(body.includes('이 항목은 자료 대조 중입니다.'),'Business editorial fallback')
}
for(const row of future.slice(0,2)) {
  const {body}=await get(`/blog/${row.slug}`,404)
  assert.doesNotMatch(body,new RegExp(`<title>${row.title_ko}`))
}
await get('/support/region/busan/jeju-jeju-si',404)
await get('/blog/this-draft-does-not-exist',404)
const {body:sitemap}=await get('/sitemap.xml')
assert.doesNotMatch(sitemap,/<lastmod>/)
for(const row of future) assert.ok(!sitemap.includes(`/blog/${row.slug}<`),`Unapproved schedule in sitemap: ${row.slug}`)
for(const route of ['/api/feed','/feed.xml']) {
  const {body,response}=await get(route)
  assert.match(response.headers.get('cache-control')??'',/no-store/)
  for(const row of future) assert.ok(!body.includes(`/blog/${row.slug}<`),`Unapproved schedule in RSS: ${row.slug}`)
}
const report={checkedAt:new Date().toISOString(),base,mode:productionDefault?'production defaults; original local snapshot DB; HTTP only, no browser telemetry executed':'read-only loopback; preview DB; telemetry disabled',result:'PASS',routes:checked,unapprovedSchedulesExcluded:future.length,...(productionDefault?{unapprovedManuscriptsExcluded:12}: {})}
await writeFile(`docs/trust-20261020/${productionDefault?'production-default-smoke':'runtime-smoke'}.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({result:report.result,routes:checked.length,unapprovedSchedulesExcluded:future.length}))
