import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
const snapshot = read('.goal-harness/local-data/public-snapshot.json')
const discovered = read('docs/trust-20261020/public-inventory.json')
const audit = read('docs/trust-20261020/public-audit.json')
const ga = read('docs/trust-20261020/ga-landings.json')
const sources = read('docs/trust-20261020/sources.json')
const manuscript = fs.readFileSync(path.join(root, 'docs/trust-20261020/manuscripts.md'), 'utf8')
const output = path.join(root, 'docs/trust-20261020/content-inventory.json')
const cutoff = new Date(snapshot.capturedAt)
const host = new URL(discovered.urls[0]).origin
const tables = snapshot.tables
const rows = new Map()
const auditByPath = new Map(audit.results.map((item) => [item.path, item]))
const manuscriptPaths = new Set([...manuscript.matchAll(/^## (\/[^\r\n]+)/gm)].map((match) => match[1].trim()))
const gaByPath = new Map()

for (const row of ga.data) {
  const landing = row.dimensions?.landingPagePlusQueryString
  if (!landing?.startsWith('/')) continue
  const clean = landing.split('?')[0].replace(/\/$/, '') || '/'
  gaByPath.set(clean, (gaByPath.get(clean) ?? 0) + Number(row.metrics.sessions))
}

function cleanPath(value) {
  const parsed = new URL(value, host)
  if (parsed.origin !== host) return null
  return parsed.pathname.replace(/\/$/, '') || '/'
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === '') return null
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function visibleAt(date, requireDate = false) {
  if (!date) return requireDate ? 'draft' : 'public_route'
  return Date.parse(date) <= cutoff.getTime() ? 'published_at_cutoff' : 'scheduled_after_cutoff'
}

function textExcerpt(value) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/[#*`>|\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320) || null
}

function evidenceFor(raw, type, slug) {
  const sourceUrls = [...new Set([
    raw.source_url,
    raw.manufacturer_url,
    ...[...String(raw.body_md ?? raw.body_html ?? '').matchAll(/https?:\/\/[^\s)\]<>"']+/g)].map((match) => match[0]),
  ].filter(Boolean))].slice(0, 12)
  const override = type === 'robot' ? sources.productOverrides?.[slug] : undefined
  return {
    storedSourceUrls: sourceUrls,
    hasOfficialSourceReview: Boolean(override?.checkedAt && override?.sourceUrl),
    sourceReviewDate: override?.checkedAt ?? null,
    sourceVerification: sourceUrls.length ? 'links_stored_not_individually_rechecked' : 'no_row_level_source_found',
  }
}

function entity(row) {
  const haystack = `${row.path} ${row.title}`.toLowerCase()
  const products = ['hyodol', 'dasom', 'lovot', 'moflin', 'paro', 'aibo', 'elliq', 'bomi', 'maibom', 'raemi', 'kkumdoli']
  const found = products.filter((product) => haystack.includes(product) || haystack.includes(({ hyodol:'효돌', dasom:'다솜', moflin:'모플린', paro:'파로', aibo:'아이보' })[product] ?? '\u0000'))
  if (found.length) return found.sort().join('+')
  if (/fall|낙상/.test(haystack)) return 'fall_safety'
  if (/medication|복약/.test(haystack)) return 'medication'
  if (/privacy|개인정보/.test(haystack)) return 'privacy'
  if (/support|지원사업/.test(haystack)) return 'support'
  if (row.type === 'blog') return `topic:${row.path.split('/').at(-1).split('-').slice(0, 2).join('-')}`
  return row.type
}

function intent(row) {
  const text = `${row.path} ${row.title}`.toLowerCase()
  if (/vs|비교/.test(text)) return 'comparison'
  if (/fee|price|cost|비용|가격|요금/.test(text)) return 'cost'
  if (/checklist|체크리스트|점검/.test(text)) return 'checklist'
  if (/setup|install|설치|설정/.test(text)) return 'setup'
  if (/warning|주의|privacy|동의/.test(text)) return 'risk'
  if (/faq|질문/.test(text)) return 'faq'
  if (/application|신청|지원/.test(text)) return 'application'
  return 'overview'
}

function add(urlPath, type, title, raw = {}, options = {}) {
  const pathName = cleanPath(urlPath)
  if (!pathName) return
  const current = rows.get(pathName)
  const publishedAt = normalizeDate(raw.published_at)
  const publicState = options.publicState ?? visibleAt(publishedAt, options.requireDate)
  const summary = raw.summary ?? raw.summary_ko ?? raw.description_short ?? null
  const body = raw.body_md ?? raw.body_html ?? ''
  const item = {
    path: pathName,
    url: host + (pathName === '/' ? '' : pathName),
    type,
    title: title || current?.title || pathName,
    publicState,
    publishedAt,
    updatedAt: normalizeDate(raw.updated_at),
    keyIntent: null,
    coreAnswer: textExcerpt(summary || body),
    numbersInStoredContent: [...new Set(`${summary ?? ''} ${body}`.match(/\b\d[\d,.]*(?:%|원|년|개월|명|대)?\b/g) ?? [])].slice(0, 20),
    evidence: evidenceFor(raw, type, raw.slug),
    verification: {
      localSnapshotAt: snapshot.capturedAt,
      publicHttp: auditByPath.get(pathName)?.status ?? null,
      publicHttpInspected: auditByPath.has(pathName),
      manuscriptDraft: manuscriptPaths.has(pathName),
      humanReviewedFlag: raw.human_reviewed === undefined ? null : Boolean(raw.human_reviewed),
    },
    gaLandingSessions: gaByPath.has(pathName) ? gaByPath.get(pathName) : null,
    gaStatus: gaByPath.has(pathName) ? 'returned_row' : 'not_in_returned_rows_not_zero',
    similarDocuments: [],
    decision: 'preserve',
    decisionReason: 'No automatic consolidation; review intent, unique information and traffic first.',
    inSitemapSnapshot: current?.inSitemapSnapshot ?? false,
    localRoute: current?.localRoute ?? false,
  }
  item.keyIntent = `${entity(item)}:${intent(item)}`
  rows.set(pathName, item)
}

for (const url of discovered.urls) {
  const urlPath = cleanPath(url)
  if (urlPath) rows.set(urlPath, {
    path: urlPath, url: host + (urlPath === '/' ? '' : urlPath), type: 'unclassified_sitemap',
    title: auditByPath.get(urlPath)?.title ?? urlPath, publicState: 'sitemap_only_unverified',
    inSitemapSnapshot: true, localRoute: false,
  })
}

function staticPaths(directory, segments = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) staticPaths(path.join(directory, entry.name), [...segments, entry.name])
    else if (entry.name === 'page.tsx' && segments.every((part) => !part.startsWith('['))) {
      const urlPath = '/' + segments.join('/')
      const name = auditByPath.get(urlPath === '/' ? '/' : urlPath)?.title ?? (segments.at(-1) || '홈')
      add(urlPath, 'static_page', name, { summary: auditByPath.get(urlPath === '/' ? '/' : urlPath)?.description }, { publicState: 'local_route_static' })
      rows.get(cleanPath(urlPath)).localRoute = true
    }
  }
}
staticPaths(path.join(root, 'src/app'))
for (const slug of ['best-value', 'senior-friendly', 'government-supported', 'companion', 'senior-care', 'rehabilitation', 'monitoring']) {
  add(`/ranking/${slug}`, 'ranking', auditByPath.get(`/ranking/${slug}`)?.title ?? `${slug} 제품 분류`, { summary: auditByPath.get(`/ranking/${slug}`)?.description }, { publicState: 'local_route_dynamic' })
  rows.get(`/ranking/${slug}`).localRoute = true
}
for (const [slug, title] of [['nursing-home', '요양원 도입 가이드'], ['welfare-center', '복지관 도입 가이드']]) {
  add(`/business/${slug}`, 'business', title, { summary: auditByPath.get(`/business/${slug}`)?.description }, { publicState: 'local_route_dynamic' })
  rows.get(`/business/${slug}`).localRoute = true
}

for (const row of tables.robots) add(`/robot/${row.slug}`, 'robot', row.name_ko, row)
for (const row of tables.comparisons) add(`/compare/${row.slug}`, 'comparison', row.title_ko, row, { requireDate: true })
for (const row of tables.guides) add(`/guide/${row.slug}`, 'guide', row.title_ko, row, { requireDate: true })
for (const row of tables.research_studies) add(`/research/${row.slug}`, 'research', row.title, row)
for (const row of tables.info_articles) add(`/info/${row.slug}`, 'info', row.title_ko, row, { requireDate: true })
for (const row of tables.blog_posts) add(`/blog/${row.slug}`, 'blog', row.title_ko, row, { requireDate: true })

const regionById = new Map(tables.regions.map((region) => [region.id, region]))
const sidoByCode = new Map(tables.regions.filter((region) => region.level === 'sido').map((region) => [region.sido_code, region]))
for (const row of tables.support_programs) {
  const region = regionById.get(row.region_id)
  const parent = region && sidoByCode.get(region.sido_code)
  const urlPath = !region ? `/support/national/${row.slug}` : region.level === 'sido'
    ? `/support/region/${region.slug}` : parent ? `/support/region/${parent.slug}/${region.slug}` : null
  if (!urlPath) continue
  // A regional route holds several programs; retain program detail in the linked list.
  if (region) continue
  add(urlPath, 'national_support', row.name_ko, row, { publicState: row.human_reviewed ? 'reviewed_legacy_route' : 'unreviewed_hidden' })
}
for (const region of tables.regions) {
  const parent = sidoByCode.get(region.sido_code)
  const isSido = region.level === 'sido'
  const linked = tables.support_programs.filter((row) => row.human_reviewed && (row.region_id === region.id || (isSido && regionById.get(row.region_id)?.sido_code === region.sido_code)))
  const urlPath = isSido ? `/support/region/${region.slug}` : parent ? `/support/region/${parent.slug}/${region.slug}` : null
  if (!urlPath) continue
  add(urlPath, isSido ? 'sido_support' : 'sigungu_support', `${region.sigungu_name ?? region.sido_name} 지원사업 자료`, { summary: `검토 완료로 표시된 기존 사업 ${linked.length}건`, body_md: linked.map((row) => `${row.name_ko} ${row.source_url}`).join('\n'), slug: region.slug },
    { publicState: linked.length ? 'reviewed_legacy_route' : 'no_reviewed_program_route' })
  rows.get(cleanPath(urlPath)).linkedProgramCount = linked.length
  rows.get(cleanPath(urlPath)).linkedProgramIds = linked.map((row) => row.id)
}

// Retain sitemap URLs with no corresponding local row; do not infer they are valid pages.
for (const item of rows.values()) {
  if (item.type === 'unclassified_sitemap') add(item.path, item.type, item.title, {}, { publicState: 'sitemap_only_unverified' })
}

const groups = new Map()
for (const item of rows.values()) {
  if (!groups.has(item.keyIntent)) groups.set(item.keyIntent, [])
  groups.get(item.keyIntent).push(item)
}
for (const group of groups.values()) {
  if (group.length < 2 || group.length > 50) continue
  for (const item of group) item.similarDocuments = group.filter((other) => other.path !== item.path).slice(0, 8).map((other) => other.path)
}

const candidates = new Set([
  '/blog/hyodol-vs-dasom-comparison',
  '/blog/fall-risk-home-layout-warning',
  '/blog/fall-risk-home-layout-faq',
])
for (const item of rows.values()) {
  if (candidates.has(item.path)) {
    item.decision = 'consolidate_candidate_review_only'
    item.decisionReason = 'Overlap candidate from editorial inspection; preserve unique answers and landing traffic before any redirect.'
  } else if (item.publicState === 'scheduled_after_cutoff' || item.publicState === 'draft') {
    item.decision = 'preserve_unpublished'
    item.decisionReason = 'Future or draft content remains excluded from public publication.'
  } else if (['blog', 'comparison', 'guide', 'info', 'research', 'robot', 'national_support', 'sido_support', 'sigungu_support'].includes(item.type)
    && item.evidence.sourceVerification === 'no_row_level_source_found' && !item.verification.manuscriptDraft) {
    item.decision = 'improve'
    item.decisionReason = 'Add row-level source and verify claims; absence of a source is not a deletion rule.'
  }
}

const items = [...rows.values()].sort((a, b) => a.path.localeCompare(b.path))
const countBy = (key) => Object.fromEntries([...new Set(items.map((item) => item[key]))].sort().map((value) => [value, items.filter((item) => item[key] === value).length]))
const result = {
  generatedAt: new Date().toISOString(),
  cutoff: snapshot.capturedAt,
  inputs: ['.goal-harness/local-data/public-snapshot.json', 'docs/trust-20261020/public-inventory.json', 'docs/trust-20261020/public-audit.json', 'docs/trust-20261020/ga-landings.json', 'docs/trust-20261020/sources.json', 'docs/trust-20261020/manuscripts.md'],
  limitations: [
    'The sitemap contains discovered URLs, not verified indexable pages.',
    `HTTP audit inspected ${audit.inspected} of ${discovered.count} sitemap URLs; the rest were not fetched.`,
    `GA returned ${ga.data.length} rows with rowLimit ${ga.query.rowLimit}; absence is not zero sessions. No Naver landing query is present.`,
    'Numbers and links are extracted from stored content and may be false or stale; they are not independently verified.',
    'SimilarDocuments is a semantic intent/product grouping for review, not a duplicate verdict.',
  ],
  gaDateRange: ga.dateRange,
  counts: { total: items.length, byType: countBy('type'), byPublicState: countBy('publicState'), byDecision: countBy('decision'), sitemapDiscovered: discovered.count, httpInspected: audit.inspected, gaReturnedRows: ga.data.length },
  items,
}
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result.counts, null, 2))
