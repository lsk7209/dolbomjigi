import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { assertLocalDraftDb } from './local-draft-guard.mjs'

const ROOT = process.cwd()
const INPUT = path.resolve(ROOT, process.argv[2] ?? path.join('scripts', 'blog-generated-2026-quality-batch.json'))

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

function assertText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`)
  }
}

function assertPost(post) {
  assertText(post.slug, 'slug')
  assertText(post.title, 'title')
  assertText(post.subtitle, 'subtitle')
  assertText(post.body_md, 'body_md')
  assertText(post.main_keyword, 'main_keyword')
  if (!Array.isArray(post.expanded_keywords) || post.expanded_keywords.length < 2) {
    throw new Error(`${post.slug}: expanded_keywords requires at least 2 items`)
  }
  if (!post.title.includes(post.main_keyword)) throw new Error(`${post.slug}: title missing main keyword`)
  if (!post.subtitle.includes(post.main_keyword)) throw new Error(`${post.slug}: subtitle missing main keyword`)
  for (const keyword of post.expanded_keywords.slice(0, 2)) {
    if (!post.title.includes(keyword) && !post.subtitle.includes(keyword)) {
      throw new Error(`${post.slug}: missing expanded keyword ${keyword}`)
    }
  }
  if ((post.quality_score ?? 0) < 90 || post.pass !== true) {
    throw new Error(`${post.slug}: structural quality gate failed; editorial review remains separate`)
  }
  const internalLinks = (post.body_md.match(/\]\(\/(robot|support|compare|guide|blog)/g) || []).length
  const outlinks = (post.body_md.match(/\]\(https:\/\//g) || []).length
  if (internalLinks < 2) throw new Error(`${post.slug}: internal links < 2`)
  if (outlinks < 1) throw new Error(`${post.slug}: outlinks < 1`)
}

function toSqlValue(value) {
  if (value === undefined || value === null) return null
  return value
}

loadEnv()
const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) throw new Error('TURSO_DATABASE_URL is required')
if (!fs.existsSync(INPUT)) throw new Error(`Input not found: ${INPUT}`)

const posts = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
if (!Array.isArray(posts) || posts.length !== 100) throw new Error(`Expected 100 posts, got ${Array.isArray(posts) ? posts.length : 'non-array'}`)
posts.forEach(assertPost)

assertLocalDraftDb(url)
const client = createClient({ url, authToken })
try {
  const existingRows = await client.execute('select slug, title_ko from blog_posts')
  const existingSlugs = new Set(existingRows.rows.map((row) => String(row.slug)))
  const existingTitles = new Set(existingRows.rows.map((row) => String(row.title_ko)))

  const duplicateSlugs = posts.filter((post) => existingSlugs.has(post.slug)).map((post) => post.slug)
  const duplicateTitles = posts.filter((post) => existingTitles.has(post.title)).map((post) => post.title)
  if (duplicateSlugs.length > 0 || duplicateTitles.length > 0) {
    throw new Error(`Existing duplicate found: slugs=${duplicateSlugs.join(', ')} titles=${duplicateTitles.join(', ')}`)
  }

  for (const post of posts) {
    await client.execute({
      sql: `insert into blog_posts (
        slug, title_ko, subtitle, summary, body_md, category, target_persona,
        tags_json, reading_time_minutes, author_id, published_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [
        post.slug,
        post.title,
        toSqlValue(post.subtitle),
        toSqlValue(post.summary),
        post.body_md,
        post.category,
        post.target_persona,
        JSON.stringify(post.tags ?? []),
        toSqlValue(post.reading_time_minutes),
        1,
        null,
      ],
    })
  }

  console.log(JSON.stringify({
    ok: true,
    inserted: posts.length,
    status: 'draft',
  }, null, 2))
} finally {
  client.close()
}
