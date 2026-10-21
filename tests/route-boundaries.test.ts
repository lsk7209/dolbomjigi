import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../src/db/schema'
import fixture from './fixtures/trust-rows.json'
import { generateMetadata } from '../src/app/blog/[slug]/page'
import supportPage from '../src/app/support/page'
import sitemap from '../src/app/sitemap'
import { NextRequest } from 'next/server'
import { GET as indexPublished } from '../src/app/api/cron/index-published/route'

const globalDb=globalThis as unknown as {_db:unknown}

test('index cron rejects absent configuration and invalid credentials before DB or indexing work',async()=>{
  const previousDb=globalDb._db
  const previousSecret=process.env.CRON_SECRET
  let databaseCalls=0
  try {
    globalDb._db={select(){databaseCalls++;throw new Error('authorized database boundary')}}
    for(const secret of [undefined,'','   ','local-test-secret']) {
      if(secret===undefined) delete process.env.CRON_SECRET
      else process.env.CRON_SECRET=secret
      const response=await indexPublished(new NextRequest('http://127.0.0.1/api/cron/index-published'))
      assert.equal(response.status,401)
    }
    process.env.CRON_SECRET='local-test-secret'
    const wrong=await indexPublished(new NextRequest('http://127.0.0.1/api/cron/index-published',{headers:{authorization:'Bearer wrong'}}))
    assert.equal(wrong.status,401)
    assert.equal(databaseCalls,0)
    await assert.rejects(indexPublished(new NextRequest('http://127.0.0.1/api/cron/index-published',{headers:{authorization:'Bearer local-test-secret'}})),/authorized database boundary/)
    assert.equal(databaseCalls,1)
  } finally {
    globalDb._db=previousDb
    if(previousSecret===undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET=previousSecret
  }
})

test('real blog metadata uses full publication identity and hides drafts',async()=>{
  const previous=globalDb._db
  const client=createClient({url:':memory:'})
  try {
    for(const file of (await readdir('drizzle')).filter(f=>/^\d+.*\.sql$/.test(f)).sort()) {
      await client.executeMultiple(await readFile(`drizzle/${file}`,'utf8'))
    }
    await client.execute('PRAGMA foreign_keys = OFF')
    const row=fixture.find(item=>item.table==='blog_posts')!.row
    const values=row as unknown as Record<string,string|number|null>
    const keys=Object.keys(values)
    await client.execute({sql:`INSERT INTO blog_posts (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,args:keys.map(k=>values[k])})
    globalDb._db=drizzle(client,{schema})
    const params=Promise.resolve({slug:String(row.slug)})
    const metadata=await generateMetadata({params})
    assert.ok(metadata.title)
    assert.equal(metadata.alternates?.canonical,`https://dolbomjigi.ehon365.kr/blog/${row.slug}`)
    await client.execute('UPDATE blog_posts SET published_at = NULL')
    await assert.rejects(generateMetadata({params}),/NEXT_HTTP_ERROR_FALLBACK;404/)
  } finally {globalDb._db=previous;client.close()}
})

test('support and sitemap propagate database failures instead of claiming empty data',async()=>{
  const previous=globalDb._db
  try {
    globalDb._db={select(){throw new Error('test database unavailable')}}
    await assert.rejects(supportPage(),/test database unavailable/)
    await assert.rejects(sitemap(),/test database unavailable/)
  } finally {globalDb._db=previous}
})
