import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const INPUT = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch-02.json')
const OUT = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch-02-enriched.json')
const MANIFEST = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch-02-enriched.manifest.json')

const sourceMap = {
  support_program: ['복지로', 'https://www.bokjiro.go.kr'],
  product_review: ['한국로봇산업진흥원', 'https://www.kiria.org'],
  care_info: ['보건복지부', 'https://www.mohw.go.kr'],
  guide: ['보건복지부', 'https://www.mohw.go.kr'],
  news: ['보건복지부', 'https://www.mohw.go.kr'],
}

function particle(word, type = '은') {
  const code = word.charCodeAt(word.length - 1)
  const batchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  if (type === '은') return `${word}${batchim ? '은' : '는'}`
  if (type === '을') return `${word}${batchim ? '을' : '를'}`
  if (type === '과') return `${word}${batchim ? '과' : '와'}`
  return `${word}${batchim ? '이' : '가'}`
}

function sentenceSet(post, idx) {
  const [a, b, c] = post.expanded_keywords
  const sets = [
    {
      scenario: `가족이 서로 다른 지역에 살고 있다면 ${particle(a, '을')} 누가 맡을지부터 정해야 합니다. ${particle(b, '은')} 비용 문제가 아니라 운영 지속성의 문제로 이어질 수 있고, ${particle(c, '은')} 실제 알림을 받은 뒤 누가 움직일지와 연결됩니다.`,
      failure: `실패하는 경우는 대개 제품을 잘못 골라서가 아니라 확인 책임이 흐려질 때 생깁니다. 한 사람은 알림을 받았다고 생각하고, 다른 사람은 누군가 이미 조치했다고 생각하면 돌봄 공백이 생깁니다.`,
      field: `현장에서 보면 첫 2주는 기능 평가 기간이 아니라 생활 패턴을 맞추는 기간에 가깝습니다. 알림이 너무 많으면 꺼 버리고, 너무 적으면 신뢰가 떨어지므로 가족이나 담당자가 매일 한 번은 기록을 같이 확인하는 편이 좋습니다.`,
    },
    {
      scenario: `기관이나 지자체가 함께 보는 상황이라면 ${particle(a, '은')} 개인의 편의가 아니라 운영 기준입니다. ${particle(b, '을')} 기록으로 남기고, ${particle(c, '은')} 담당자가 바뀌어도 이어질 수 있게 문서화해야 합니다.`,
      failure: `도입 초기에 가장 자주 생기는 문제는 기대치가 서로 다르다는 점입니다. 보호자는 즉각적인 안심을 기대하고, 담당자는 업무 부담 감소를 기대하지만, 어르신은 낯선 기기를 부담스러워할 수 있습니다.`,
      field: `그래서 설명 순서는 기능 소개보다 상황 확인이 먼저입니다. 어르신에게는 왜 필요한지, 보호자에게는 언제 확인할지, 담당자에게는 어떤 기록을 남길지 따로 설명해야 합니다.`,
    },
    {
      scenario: `처음 설치하는 가정에서는 ${particle(a, '을')} 크게 잡기보다 작게 시작하는 편이 좋습니다. ${particle(b, '은')} 가족의 불안을 줄이기 위한 장치이고, ${particle(c, '은')} 실제 생활에서 조정해야 할 항목입니다.`,
      failure: `처음부터 모든 알림과 기능을 켜면 어르신은 감시받는 느낌을 받을 수 있습니다. 반대로 기능을 너무 적게 켜면 보호자는 효과를 체감하지 못합니다.`,
      field: `가장 현실적인 방식은 첫 주에는 핵심 기능 1~2개만 쓰고, 둘째 주부터 기록을 보며 조정하는 것입니다. 이 과정을 거치면 제품 비교보다 우리 집 기준이 먼저 보입니다.`,
    },
  ]
  return sets[idx % sets.length]
}

function table(post) {
  const [a, b, c] = post.expanded_keywords
  return `| 구분 | 확인 질문 | 기록할 내용 | 조정 시점 |
|---|---|---|---|
| ${a} | 누가, 언제 확인하나 | 담당자와 확인 시간 | 설치 전 |
| ${b} | 알림 뒤 어떤 행동을 하나 | 연락 순서와 미응답 기준 | 첫 1주 |
| ${c} | 어르신이 부담을 느끼지 않나 | 동의 범위와 끄는 방법 | 첫 2주 |
| 비용·지원 | 자부담과 지원 조건이 맞나 | 월 비용, 약정, 신청처 | 신청 전 |`
}

function checklist(post) {
  const [a, b, c] = post.expanded_keywords
  return `- [ ] ${particle(post.main_keyword, '을')} 쓰는 이유를 가족 또는 담당자와 한 문장으로 합의했다
- [ ] ${a} 담당자와 확인 시간을 정했다
- [ ] ${b} 기준을 알림 단계별로 나눴다
- [ ] ${c} 관련 동의 범위와 예외 상황을 설명했다
- [ ] 지원사업이나 렌탈 조건을 공식 페이지에서 확인했다
- [ ] 설치 후 2주 동안 바꿀 수 있는 설정 목록을 적어 두었다`
}

function faq(post) {
  const [a, b, c] = post.expanded_keywords
  return `### Q. ${post.main_keyword}은 제품 기능만 보면 충분한가요?

A. 충분하지 않습니다. ${a}, ${b}, ${c}가 실제 생활 흐름과 맞아야 합니다. 기능이 있어도 확인자와 연락 순서가 없으면 알림은 쌓이기만 합니다.

### Q. 어르신이 불편해하면 바로 중단해야 하나요?

A. 중단보다 조정이 먼저입니다. 알림 빈도, 음량, 공유 범위, 카메라나 녹음 설정을 줄여 보고 그래도 거부감이 크면 대체 기능을 선택하는 편이 좋습니다.

### Q. 지원사업 신청 전에는 무엇을 봐야 하나요?

A. 대상 조건, 자부담, 설치 가능 지역, 반납 조건을 먼저 확인해야 합니다. [지원사업 안내](/support)와 거주지 지자체 공고를 함께 보세요.

### Q. 가족끼리 의견이 다르면 어떻게 정하나요?

A. 비용을 누가 낼지보다 알림을 누가 볼지부터 정하는 것이 좋습니다. 운영 책임이 정해지면 비용과 제품 선택도 더 쉽게 합의됩니다.`
}

function body(post, idx) {
  const [sourceName, sourceUrl] = /개인정보|동의|기록|계정|녹음|삭제/.test(post.main_keyword)
    ? ['개인정보보호위원회', 'https://www.pipc.go.kr']
    : sourceMap[post.category] ?? sourceMap.guide
  const [a, b, c] = post.expanded_keywords
  const s = sentenceSet(post, idx)
  const mainLink = post.category === 'support_program' ? '[지원사업 안내](/support)' : post.category === 'product_review' ? '[제품 비교](/compare)' : '[이용 가이드](/guide)'
  const accent = idx % 2 === 0 ? 'key' : 'tip'
  const second = idx % 3 === 0 ? 'warn' : 'tip'

  return `# ${post.title}

${post.summary} 검색자가 ${particle(post.main_keyword, '을')} 찾는 이유는 단순히 제품을 사고 싶어서가 아닙니다. 실제로는 ${a}, ${b}, ${c} 중 어디에서 돌봄 공백이 생기는지 확인하려는 경우가 많습니다. 이 글은 2026년 기준으로 가족 보호자, 생활지원사, 기관 담당자가 같은 기준으로 이야기할 수 있도록 정리했습니다.

:::${accent}
${post.main_keyword}의 핵심은 기능을 많이 켜는 것이 아니라 ${particle(a, '과')} ${b}를 실제 행동으로 연결하는 것입니다. 제품 후보를 보기 전에 확인자, 알림 기준, 동의 범위를 먼저 정하세요.
:::

## ${post.main_keyword} 검색자가 먼저 확인해야 할 상황

${s.scenario}

이 단계에서 바로 제품명이나 가격표로 넘어가면 중요한 기준이 빠질 수 있습니다. 예를 들어 ${particle(a, '은')} 매일 확인해야 하는 항목인지, 주 1회 점검해도 되는 항목인지에 따라 필요한 기능이 달라집니다. ${particle(b, '은')} 보호자의 안심과 연결되지만, 어르신에게는 부담으로 느껴질 수도 있습니다. ${particle(c, '은')} 설치 뒤 실제로 가장 자주 조정하는 항목입니다.

${s.failure}

## ${a}와 ${b}를 나눠 보는 판단표

${table(post)}

표에서 한 칸이라도 비어 있다면 아직 신청이나 구매보다 기준 정리가 먼저입니다. 특히 가족이 여러 명일 때는 대표 보호자 1명, 예비 연락자 1명, 실제 방문 가능자 1명을 구분해야 합니다. 기관이라면 근무 교대 때 누가 기록을 넘겨받는지도 함께 정해야 합니다.

## ${c}까지 포함한 설치 전 체크리스트

${checklist(post)}

체크리스트는 단순한 준비물이 아니라 나중에 분쟁을 줄이는 장치입니다. 월 이용료, 반납 조건, 개인정보 공유 범위, 알림 수신자 같은 항목은 설치 후에 바꾸기 어렵거나 가족끼리 해석이 갈릴 수 있습니다. 그래서 신청 전 단계에서 문서로 남기는 편이 좋습니다.

:::${second}
지원금, 제품 구성, 개인정보 설정은 바뀔 수 있습니다. 신청이나 계약 전에는 [${sourceName}](${sourceUrl})와 제조사 안내, 거주지 지자체 공고를 함께 확인하세요.
:::

## 실제 운영에서 자주 생기는 문제

${s.field}

첫째, 알림이 너무 많아지는 문제가 있습니다. 이때는 모든 알림을 끄기보다 긴급, 주의, 참고 알림으로 나눠야 합니다. 둘째, 가족이 앱을 설치했지만 아무도 정기적으로 보지 않는 문제가 있습니다. 이 경우에는 매일 볼 사람과 주말에 다시 확인할 사람을 나눠야 합니다. 셋째, 어르신이 기기를 불편해하는 문제가 있습니다. 이때는 기능 설명보다 끄는 방법과 조정할 수 있는 범위를 알려야 거부감이 줄어듭니다.

## ${post.main_keyword} FAQ

${faq(post)}

## 관련 페이지에서 이어서 확인하기

${mainLink}에서 제도와 준비 절차를 먼저 확인하고, 기능 후보는 [돌봄로봇 제품](/robot)에서 좁히는 흐름이 좋습니다. 비용이나 유지 조건을 비교해야 한다면 [제품 비교](/compare)를 함께 열어 두세요. 처음 설치하는 경우에는 [이용 가이드](/guide)를 먼저 보고 설치 당일 설명 순서를 정하는 편이 안전합니다.

## 결론: 제품보다 기준을 먼저 정하기

${post.main_keyword}은 좋은 제품 하나로 끝나는 문제가 아닙니다. ${a}, ${b}, ${c}를 누가 확인하고 어떻게 조정할지 정해야 실제 돌봄 공백을 줄일 수 있습니다. 오늘 할 일은 제품명을 고르는 것이 아니라 가족이나 담당자와 기준표를 채우는 것입니다. 기준이 정리되면 지원사업 확인, 제품 비교, 설치 준비가 훨씬 빠르게 이어집니다.
`
}

function score(post) {
  let value = 100
  if (!post.title.includes(post.main_keyword)) value -= 20
  if (!post.subtitle.includes(post.main_keyword)) value -= 15
  for (const keyword of post.expanded_keywords.slice(0, 2)) {
    if (!post.title.includes(keyword)) value -= 8
    if (!post.subtitle.includes(keyword)) value -= 5
  }
  const internalLinks = (post.body_md.match(/\]\(\/(robot|support|compare|guide|blog)/g) || []).length
  const outlinks = (post.body_md.match(/\]\(https:\/\//g) || []).length
  const h2 = (post.body_md.match(/^## /gm) || []).length
  const h3 = (post.body_md.match(/^### /gm) || []).length
  if (internalLinks < 3) value -= 10
  if (outlinks < 1) value -= 10
  if (h2 < 6) value -= 8
  if (h3 < 4) value -= 8
  if (!post.body_md.includes('|---|')) value -= 8
  if ((post.body_md.match(/- \[ \]/g) || []).length < 4) value -= 8
  if (post.body_md.length < 3000) value -= 15
  return Math.max(0, value)
}

function cleanText(text) {
  return text
    .replaceAll('분담와', '분담과')
    .replaceAll('분담가', '분담이')
    .replaceAll('기간와', '기간과')
    .replaceAll('비용와', '비용과')
    .replaceAll('설정와', '설정과')
    .replaceAll('문항와', '문항과')
    .replaceAll('기준는', '기준은')
}

const posts = JSON.parse(fs.readFileSync(INPUT, 'utf8')).map((post, idx) => {
  const enriched = { ...post }
  enriched.title = cleanText(enriched.title)
  enriched.subtitle = cleanText(enriched.subtitle)
  enriched.summary = cleanText(enriched.summary)
  enriched.body_md = cleanText(body(enriched, idx))
  enriched.reading_time_minutes = Math.max(8, Math.round(enriched.body_md.length / 650))
  enriched.quality_score = score(enriched)
  enriched.pass = enriched.quality_score >= 90
  return enriched
})

const badPhrases = ['분담와', '분담가', '기준는', '문항와', '기간와', '비용와', '설정와']
const failed = posts
  .map((post) => ({
    post,
    phrase: badPhrases.find((phrase) => `${post.title}\n${post.subtitle}\n${post.summary}\n${post.body_md}`.includes(phrase)),
  }))
  .filter(({ post, phrase }) => !post.pass || phrase)
if (failed.length > 0) {
  throw new Error(`enrichment failed: ${failed.map(({ post, phrase }) => `${post.slug}:${post.quality_score}:${phrase ?? 'score'}`).join(', ')}`)
}

const manifest = {
  run_id: `quality-100-batch-02-enriched-${new Date().toISOString()}`,
  source: INPUT,
  output: OUT,
  count: posts.length,
  min_quality_score: Math.min(...posts.map((post) => post.quality_score)),
  average_chars: Math.round(posts.reduce((sum, post) => sum + post.body_md.length, 0) / posts.length),
  min_chars: Math.min(...posts.map((post) => post.body_md.length)),
  review_items: [],
  failed_items: [],
}

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8')
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, out: OUT, manifest: MANIFEST, count: posts.length, minQuality: manifest.min_quality_score, averageChars: manifest.average_chars, minChars: manifest.min_chars }, null, 2))
