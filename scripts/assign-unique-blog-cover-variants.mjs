import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { createClient } from '@libsql/client'

const ROOT = process.cwd()
const POSTS_DIR = path.join(ROOT, 'public', 'images', 'blog-ai', 'posts')
const FORCE = process.argv.includes('--force')

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const TOPIC_IMAGES = [
  [/낙상|넘어|fall/i, 'fall-safety.jpg'],
  [/복약|약|medication/i, 'medication-reminder.jpg'],
  [/영상통화|통화|가족 연결|remote|abroad/i, 'family-video-call.jpg'],
  [/개인정보|사생활|카메라|데이터|동의|privacy/i, 'privacy-consent.jpg'],
  [/보조금|지원|신청|서류|자격|소득|공고|지자체|program|subsidy/i, 'support-application.jpg'],
  [/가격|비용|렌탈|구매|월 사용료|자부담|구독|비교|리뷰|cost|price|review|compare/i, 'product-comparison.jpg'],
  [/요양원|복지관|기관|대량|facility|institution/i, 'institution-care.jpg'],
  [/배회|야간|밤|수면|sleep|night/i, 'night-sleep-care.jpg'],
  [/수분|식사|탈수|meal|hydration/i, 'hydration-meal.jpg'],
  [/재활|뇌졸중|회복|활동|운동|rehabilitation/i, 'rehabilitation-care.jpg'],
  [/인지|두뇌|퀴즈|회상|치매|cognitive/i, 'cognitive-activity.jpg'],
  [/와이파이|연결|설정|설치|setup|wifi/i, 'setup-wifi.jpg'],
  [/말벗|대화|외로움|정서|고독|conversation|loneliness/i, 'general-care.jpg'],
]

const CATEGORY_IMAGES = {
  product_review: ['product-comparison.jpg', 'general-care.jpg', 'privacy-consent.jpg', 'setup-wifi.jpg'],
  support_program: ['support-application.jpg', 'institution-care.jpg', 'general-care.jpg', 'product-comparison.jpg'],
  guide: ['setup-wifi.jpg', 'general-care.jpg', 'family-video-call.jpg', 'privacy-consent.jpg'],
  news: ['support-application.jpg', 'institution-care.jpg', 'product-comparison.jpg', 'general-care.jpg'],
  care_info: ['general-care.jpg', 'family-video-call.jpg', 'night-sleep-care.jpg', 'hydration-meal.jpg'],
}

const ALL_BASE_IMAGES = [
  'general-care.jpg',
  'fall-safety.jpg',
  'medication-reminder.jpg',
  'family-video-call.jpg',
  'privacy-consent.jpg',
  'support-application.jpg',
  'product-comparison.jpg',
  'institution-care.jpg',
  'night-sleep-care.jpg',
  'hydration-meal.jpg',
  'rehabilitation-care.jpg',
  'cognitive-activity.jpg',
  'setup-wifi.jpg',
]

function seedFor(slug) {
  let hash = 2166136261
  for (const char of slug) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function sourceFor(post) {
  const text = `${post.title_ko ?? ''} ${post.subtitle ?? ''} ${post.summary ?? ''} ${post.slug ?? ''}`
  const match = TOPIC_IMAGES.find(([pattern]) => pattern.test(text))
  const candidates = [
    match?.[1],
    ...(CATEGORY_IMAGES[post.category] ?? CATEGORY_IMAGES.care_info),
    ...ALL_BASE_IMAGES,
  ].filter(Boolean)
  const uniqueCandidates = [...new Set(candidates)]
  const fileName = uniqueCandidates[seedFor(String(post.slug)) % uniqueCandidates.length]
  return path.join(ROOT, 'public', 'images', 'blog-ai', fileName)
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  fs.mkdirSync(POSTS_DIR, { recursive: true })
  const rows = await client.execute('select slug,title_ko,subtitle,summary,category,target_persona from blog_posts order by published_at, slug')
  const manifest = rows.rows.map((post) => ({
    slug: post.slug,
    seed: seedFor(String(post.slug)),
    source: sourceFor(post),
    out: path.join(POSTS_DIR, `${post.slug}.jpg`),
    publicPath: `/images/blog-ai/posts/${post.slug}.jpg`,
    force: FORCE,
  }))
  const manifestPath = path.join(os.tmpdir(), `dolbomjigi-cover-manifest-${Date.now()}.json`)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  const result = spawnSync('python', [path.join(ROOT, 'scripts', 'create-blog-cover-variants.py'), manifestPath], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  fs.rmSync(manifestPath, { force: true })
  if (result.status !== 0) {
    throw new Error(`${result.stderr}\n${result.stdout}`)
  }

  for (const item of manifest) {
    await client.execute({
      sql: 'update blog_posts set cover_image_url = ?, updated_at = unixepoch() where slug = ?',
      args: [item.publicPath, item.slug],
    })
  }

  console.log(JSON.stringify({
    ok: true,
    python: result.stdout.trim() ? JSON.parse(result.stdout) : null,
    totalPosts: rows.rows.length,
    distinctCoverUrls: new Set(manifest.map((item) => item.publicPath)).size,
    coverDir: '/images/blog-ai/posts',
  }, null, 2))
} finally {
  client.close()
}
