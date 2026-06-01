import fs from 'fs'
import { createClient } from '@libsql/client'

const MIN_BODY_CHARS = 4200
const MIN_SCORE = 90
const mojibakeTokens = ['�', '遺', '湲', '臾', '鍮', '吏', '嫄', '蹂', '怨', '?']

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

function audit(row) {
  const title = String(row.title_ko ?? '')
  const subtitle = String(row.subtitle ?? '')
  const body = String(row.body_md ?? '')
  const h2 = (body.match(/^## /gm) || []).length
  const h3 = (body.match(/^### /gm) || []).length
  const checks = (body.match(/- \[ \]/g) || []).length
  const tables = (body.match(/\|---\|/g) || []).length
  const callouts = (body.match(/^:::/gm) || []).length / 2
  const internal = (body.match(/\]\(\//g) || []).length
  const out = (body.match(/\]\(https:\/\//g) || []).length
  const text = `${title}\n${subtitle}\n${body}`
  let score = 100
  if (body.length < MIN_BODY_CHARS) score -= 25
  if (h2 < 8) score -= 10
  if (h3 < 3) score -= 8
  if (checks < 5) score -= 8
  if (tables < 2) score -= 6
  if (callouts < 2) score -= 5
  if (internal < 4) score -= 8
  if (out < 1) score -= 10
  if (!subtitle) score -= 8
  if (mojibakeTokens.some((token) => text.includes(token))) score -= 20
  return { score: Math.max(0, score), chars: body.length, h2, h3, checks, tables, callouts, internal, out }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  const now = Math.floor(Date.now() / 1000)
  const rows = await client.execute({
    sql: 'select slug,title_ko,subtitle,body_md,published_at from blog_posts where published_at > ? order by published_at',
    args: [now],
  })
  const audits = rows.rows.map((row) => ({
    slug: row.slug,
    title: row.title_ko,
    kst: new Date(Number(row.published_at) * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    ...audit(row),
  }))
  const weak = audits.filter((item) => item.score < MIN_SCORE || item.chars < MIN_BODY_CHARS)
  console.log(JSON.stringify({
    futureCount: audits.length,
    weakCount: weak.length,
    minScore: Math.min(...audits.map((item) => item.score)),
    minChars: Math.min(...audits.map((item) => item.chars)),
    avgChars: Math.round(audits.reduce((sum, item) => sum + item.chars, 0) / audits.length),
    weakSample: weak.slice(0, 20),
  }, null, 2))
} finally {
  client.close()
}
