import fs from 'fs'
import { createClient } from '@libsql/client'

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const TOPIC_IMAGES = [
  [/낙상|넘어|fall/i, '/images/blog-ai/fall-safety.jpg'],
  [/복약|약|medication/i, '/images/blog-ai/medication-reminder.jpg'],
  [/영상통화|통화|가족 연결|remote|abroad/i, '/images/blog-ai/family-video-call.jpg'],
  [/개인정보|사생활|카메라|데이터|동의|privacy/i, '/images/blog-ai/privacy-consent.jpg'],
  [/보조금|지원|신청|서류|자격|소득|공고|지자체|program|subsidy/i, '/images/blog-ai/support-application.jpg'],
  [/가격|비용|렌탈|구매|월 사용료|자부담|구독|비교|리뷰|cost|price|review|compare/i, '/images/blog-ai/product-comparison.jpg'],
  [/요양원|복지관|기관|대량|facility|institution/i, '/images/blog-ai/institution-care.jpg'],
  [/배회|야간|밤|수면|sleep|night/i, '/images/blog-ai/night-sleep-care.jpg'],
  [/수분|식사|탈수|meal|hydration/i, '/images/blog-ai/hydration-meal.jpg'],
  [/재활|뇌졸중|회복|활동|운동|rehabilitation/i, '/images/blog-ai/rehabilitation-care.jpg'],
  [/인지|두뇌|퀴즈|회상|치매|cognitive/i, '/images/blog-ai/cognitive-activity.jpg'],
  [/와이파이|연결|설정|설치|setup|wifi/i, '/images/blog-ai/setup-wifi.jpg'],
  [/말벗|대화|외로움|정서|고독|conversation|loneliness/i, '/images/blog-ai/general-care.jpg'],
]

const CATEGORY_IMAGES = {
  product_review: '/images/blog-ai/product-comparison.jpg',
  support_program: '/images/blog-ai/support-application.jpg',
  guide: '/images/blog-ai/setup-wifi.jpg',
  news: '/images/blog-ai/support-application.jpg',
  care_info: '/images/blog-ai/general-care.jpg',
}

function imageFor(post) {
  const text = `${post.title_ko ?? ''} ${post.subtitle ?? ''} ${post.summary ?? ''} ${post.slug ?? ''}`
  const matched = TOPIC_IMAGES.find(([pattern]) => pattern.test(text))
  return matched?.[1] ?? CATEGORY_IMAGES[post.category] ?? CATEGORY_IMAGES.care_info
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  const rows = await client.execute('select slug,title_ko,subtitle,summary,category,cover_image_url from blog_posts order by published_at, slug')
  const counts = {}
  for (const post of rows.rows) {
    const coverImageUrl = imageFor(post)
    counts[coverImageUrl] = (counts[coverImageUrl] ?? 0) + 1
    if (post.cover_image_url === coverImageUrl) continue
    await client.execute({
      sql: 'update blog_posts set cover_image_url = ?, updated_at = unixepoch() where slug = ?',
      args: [coverImageUrl, post.slug],
    })
  }
  console.log(JSON.stringify({
    ok: true,
    updated: rows.rows.length,
    imageCounts: counts,
  }, null, 2))
} finally {
  client.close()
}
