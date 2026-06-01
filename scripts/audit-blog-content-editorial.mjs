import fs from 'fs'
import { createClient } from '@libsql/client'

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const checks = [
  ['wifi_truncated', /와이파(?!이)/],
  ['bare_short_keyword_bo', /(^|[\s,])보(가|를| 기준|부터|까지)/],
  ['source_bad_josa', /한국로봇산업진흥원와/],
  ['lte_bad_josa', /LTE 통신는/],
  ['sensor_bad_josa', /센서 대안가/],
  ['evaluation_bad_josa', /사업 평가표을/],
  ['duplicated_josa', /[가-힣A-Za-z0-9]+(을을|를를|은은|는는|가가|과와|와과)/],
  ['category_token', /(care_info|product_review|support_program|guide까지|news까지)/],
  ['old_template_marker', /(검색자가 먼저 확인해야 할 상황|판단표와 체크리스트|빠른 답보다 틀리지 않는 기준|공식 정보 확인 순서|관련 페이지에서 이어서 확인하기)/],
]

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

function uniq(items) {
  return [...new Set(items)]
}

try {
  const result = await client.execute('select slug,title_ko,subtitle,summary,body_md from blog_posts order by published_at, slug')
  const rows = result.rows.map((row) => ({
    slug: String(row.slug),
    title: String(row.title_ko ?? ''),
    subtitle: String(row.subtitle ?? ''),
    summary: String(row.summary ?? ''),
    body: String(row.body_md ?? ''),
  }))

  const issues = []
  const headingCounts = new Map()
  const chunkCounts = new Map()

  for (const row of rows) {
    const text = `${row.title}\n${row.subtitle}\n${row.summary}\n${row.body}`
    const rowIssues = []
    for (const [name, regex] of checks) {
      if (regex.test(text)) rowIssues.push(name)
    }
    if (rowIssues.length) issues.push({ slug: row.slug, issues: rowIssues })

    for (const match of row.body.matchAll(/^#{2,3} (.+)$/gm)) {
      headingCounts.set(match[1], (headingCounts.get(match[1]) ?? 0) + 1)
    }

    const normalized = row.body
      .replace(/[#>*`[\]()|:-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const chunks = normalized.match(/.{90}/g) ?? []
    for (const chunk of uniq(chunks)) {
      chunkCounts.set(chunk, (chunkCounts.get(chunk) ?? 0) + 1)
    }
  }

  const repeatedHeadings = [...headingCounts]
    .filter(([, count]) => count >= 80)
    .sort((a, b) => b[1] - a[1])
  const repeatedChunks = [...chunkCounts]
    .filter(([, count]) => count >= 20)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  console.log(JSON.stringify({
    total: rows.length,
    issueRows: issues.length,
    issueCounts: Object.fromEntries(checks.map(([name]) => [
      name,
      issues.filter((item) => item.issues.includes(name)).length,
    ])),
    issueSample: issues.slice(0, 20),
    repeatedHeadingCount: repeatedHeadings.length,
    repeatedHeadings: repeatedHeadings.slice(0, 20),
    repeatedChunkCount: repeatedChunks.length,
    repeatedChunks,
  }, null, 2))
} finally {
  client.close()
}
