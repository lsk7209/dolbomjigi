import assert from 'node:assert/strict'
import test from 'node:test'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { blogPosts } from '../src/db/schema'
import { isPublicAt, publicAtOrBefore } from '../src/lib/publication'
const legacy=[
  {table:'blog_posts',id:3,slug:'boundary',publishedAt:1792497600},
  {table:'blog_posts',id:4,slug:'past',publishedAt:1792411200},
]

test('publication requires an existing date at or before request time', () => {
  const now = new Date('2026-10-20T12:00:00.000Z')
  assert.equal(isPublicAt(null, now), false)
  assert.equal(isPublicAt(new Date('2026-10-20T12:00:00.001Z'), now), false)
  assert.equal(isPublicAt(new Date('2026-10-20T12:00:00.000Z'), now,{id:3,slug:'boundary'},'blog_posts',[],legacy), true)
  assert.equal(isPublicAt(new Date('2026-10-19T12:00:00.000Z'), now,{id:4,slug:'past'},'blog_posts',[],legacy), true)
})

test('SQL predicate excludes drafts and future rows at the same boundary', async () => {
  const now = new Date('2026-10-20T12:00:00.000Z')
  const client = createClient({ url: ':memory:' })
  try {
    await client.execute('create table blog_posts (id integer, slug text, published_at integer)')
    await client.execute("insert into blog_posts values (1, 'draft', null), (2, 'future', 1792497601), (3, 'boundary', 1792497600), (4, 'past', 1792411200), (5, 'new-backdated', 1792411200)")
    const db = drizzle(client)
    const rows = await db.select({ slug: blogPosts.slug }).from(blogPosts).where(publicAtOrBefore(blogPosts.published_at, now,[],legacy))
    assert.deepEqual(rows.map((row) => row.slug).sort(), ['boundary', 'past'])
  } finally {
    client.close()
  }
})
