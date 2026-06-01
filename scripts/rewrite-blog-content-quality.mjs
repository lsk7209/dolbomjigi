import fs from 'fs'
import { createClient } from '@libsql/client'

const MIN_BODY_CHARS = 4600
const MIN_SCORE = 90

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const categoryKeywords = {
  care_info: ['안부 확인', '생활 패턴', '보호자 알림', '안전 기준', '정서 지원'],
  product_review: ['기능 비교', '월 비용', '사용 후기', 'AS 조건', '설치 난이도'],
  support_program: ['지원 조건', '신청 서류', '지자체 공고', '본인부담금', '접수 일정'],
  guide: ['설정 순서', '운영 기록', '가족 공유', '점검 주기', '문제 해결'],
  news: ['정책 변화', '현장 영향', '확인 기준', '도입 일정', '예산 근거'],
}

const officialSources = {
  care_info: ['보건복지부', 'https://www.mohw.go.kr'],
  product_review: ['한국로봇산업진흥원', 'https://www.kiria.org'],
  support_program: ['복지로', 'https://www.bokjiro.go.kr'],
  guide: ['보건복지부', 'https://www.mohw.go.kr'],
  news: ['보건복지부', 'https://www.mohw.go.kr'],
  privacy: ['개인정보보호위원회', 'https://www.pipc.go.kr'],
}

const internalLinks = {
  care_info: [
    ['돌봄로봇 사용 가이드', '/guide'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['제품 비교표', '/compare'],
    ['지원사업 확인', '/support'],
    ['관련 블로그', '/blog'],
  ],
  product_review: [
    ['제품 비교표', '/compare'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['구매 전 가이드', '/guide'],
    ['지원사업 확인', '/support'],
    ['관련 블로그', '/blog'],
  ],
  support_program: [
    ['지원사업 확인', '/support'],
    ['신청 전 가이드', '/guide'],
    ['제품 비교표', '/compare'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['관련 블로그', '/blog'],
  ],
  guide: [
    ['돌봄로봇 사용 가이드', '/guide'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['제품 비교표', '/compare'],
    ['지원사업 확인', '/support'],
    ['관련 블로그', '/blog'],
  ],
  news: [
    ['지원사업 확인', '/support'],
    ['돌봄로봇 사용 가이드', '/guide'],
    ['제품 비교표', '/compare'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['관련 블로그', '/blog'],
  ],
}

const bannedMarkers = [
  '검색자가 먼저 확인해야 할 상황',
  '판단표와 체크리스트',
  '제품 이름이 아니라 확인 책임자',
  '빠른 답보다 틀리지 않는 기준',
  '공식 정보 확인 순서',
  '관련 페이지에서 이어서 확인하기',
]

function parseTags(tagsJson) {
  try {
    const value = JSON.parse(tagsJson ?? '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

function hasBatchim(word) {
  const char = Array.from(String(word)).at(-1)
  if (!char) return false
  const code = char.charCodeAt(0)
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
}

function josa(word, pair) {
  const [withBatchim, withoutBatchim] = pair.split('/')
  return `${word}${hasBatchim(word) ? withBatchim : withoutBatchim}`
}

function cleanTitle(title) {
  return String(title ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[“”"]/g, '')
    .trim()
}

function normalizeMain(title) {
  const text = cleanTitle(title)
    .replace(/^2026년\s*/, '2026년 ')
    .replace(/[?!.]/g, '')
  const pieces = text.split(/[,:—·|]/).map((item) => item.trim()).filter(Boolean)
  const main = pieces[0] ?? text
  return main
    .replace(/\s*(정리했다|총정리|보는 법|가능할까|어떻게 작동하나|괜찮을까)$/g, '')
    .trim()
    .slice(0, 34)
}

function tokenize(text) {
  return String(text ?? '')
    .replace(/[^\p{Script=Hangul}A-Za-z0-9\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 18)
}

function inferKeywords(row, main) {
  const defaults = categoryKeywords[row.category] ?? categoryKeywords.guide
  const raw = [
    ...parseTags(row.tags_json),
    ...tokenize(row.subtitle),
    ...tokenize(row.summary),
    ...tokenize(row.title_ko),
    ...defaults,
  ]
  const stop = new Set([
    '돌봄로봇',
    '어르신',
    '가이드',
    '고품질',
    '함께',
    '보는',
    '보',
    '기준',
    '정리',
    '확인',
    '국내',
    '2026년',
    'care_info',
    'product_review',
    'support_program',
    'guide',
    'news',
  ])
  const unique = []
  for (const original of raw) {
    if (stop.has(String(original ?? '').trim())) continue
    const word = normalizeKeyword(original)
    if (!word || stop.has(word) || /^[a-z_]+$/.test(word)) continue
    if (main.includes(word) || word.includes(main)) continue
    if (unique.some((item) => item.includes(word) || word.includes(item))) continue
    unique.push(word)
    if (unique.length >= 5) break
  }
  for (const word of defaults) {
    if (unique.length >= 5) break
    if (!unique.includes(word) && !main.includes(word)) unique.push(word)
  }
  return unique.slice(0, 5)
}

function normalizeKeyword(word) {
  let value = String(word ?? '').trim()
  if (value === '와이파') return '와이파이'
  value = value.replace(/(으로|에게|에서|까지|부터|처럼|보다|을|를|은|는)$/g, '')
  if (value.length >= 3 && !['와이파이'].includes(value)) value = value.replace(/(과|와)$/g, '')
  return value.trim()
}

function sourceFor(row, main, keywords) {
  const text = `${row.title_ko} ${row.subtitle} ${row.summary} ${main} ${keywords.join(' ')}`
  if (/개인정보|사생활|카메라|녹음|계정|동의|데이터|영상정보/.test(text)) return officialSources.privacy
  return officialSources[row.category] ?? officialSources.guide
}

function personaName(persona) {
  if (persona === 'public_servant') return '지자체 담당자'
  if (persona === 'institution') return '기관 운영자'
  if (persona === 'social_worker') return '생활지원사'
  return '가족 보호자'
}

function intentLine(row, main, keywords) {
  const persona = personaName(row.target_persona)
  if (row.target_persona === 'public_servant') {
    return `${persona}라면 ${josa(main, '을/를')} 단순 보급 품목이 아니라 민원 대응, 사업 설명, 예산 근거까지 이어지는 운영 과제로 봐야 합니다. ${keywords[0]}, ${keywords[1]}, ${josa(keywords[2], '이/가')} 같은 문서 안에서 설명되어야 다음 공고나 보고 자료에도 흔들리지 않습니다.`
  }
  if (row.target_persona === 'institution') {
    return `${persona}라면 한 명의 성공 사례보다 여러 이용자에게 같은 기준으로 적용 가능한지가 더 중요합니다. ${keywords[0]}, ${keywords[1]}, ${keywords[2]}를 담당자 교대와 보호자 문의 상황에서도 반복 확인할 수 있어야 합니다.`
  }
  if (row.target_persona === 'social_worker') {
    return `${persona}라면 방문 시간 안에 확인할 항목과 보호자에게 설명할 항목을 분리해야 합니다. ${keywords[0]}, ${keywords[1]}, ${josa(keywords[2], '이/가')} 기록으로 남아야 다음 방문 때 상태 변화를 놓치지 않습니다.`
  }
  return `${persona}라면 제품 이름보다 실제 생활에서 누가 확인하고 누가 연락할지를 먼저 정해야 합니다. ${keywords[0]}, ${keywords[1]}, ${josa(keywords[2], '이/가')} 가족 안에서 합의되지 않으면 알림은 많아도 돌봄 공백은 그대로 남습니다.`
}

function sectionSet(index) {
  const sets = [
    ['생활 장면부터 보는 이유', '가족 회의에서 바로 쓸 질문', '설치 전후로 달라지는 점'],
    ['먼저 걸러야 할 위험 신호', '비용보다 먼저 볼 운영 기준', '2주 사용 후 다시 볼 항목'],
    ['현장 담당자가 놓치기 쉬운 기준', '보호자 설명을 쉽게 만드는 표', '반대 의견이 나올 때 조정법'],
    ['제품 비교 전에 정할 것', '신청과 설치 사이의 공백 줄이기', '실제 사용 기록을 남기는 법'],
    ['어르신 반응을 먼저 확인하는 순서', '알림 피로를 줄이는 설정', '지속 사용을 위한 점검 루틴'],
    ['기관 도입 때 필요한 운영 언어', '책임자 변경에도 유지되는 기록', '성과를 설명하는 기준'],
  ]
  return sets[index % sets.length]
}

function introVariant(row, main, keywords, sourceName, index) {
  const variants = [
    `${josa(main, '을/를')} 검색하는 사람은 보통 빠른 답을 원합니다. 하지만 돌봄 영역에서는 제품명 하나보다 실제 생활에 맞는 기준이 더 중요합니다. 이 글은 2026년 기준으로 ${keywords[0]}, ${keywords[1]}, ${josa(keywords[2], '을/를')} 먼저 확인한 뒤 구매, 신청, 설치를 판단하도록 정리했습니다. 마지막 결정 전에는 ${josa(sourceName, '과/와')} 거주지 지자체 공고를 함께 확인하는 방식이 안전합니다.`,
    `${main} 문제는 겉으로는 기능 비교처럼 보이지만 실제로는 가족의 역할 분담, 알림 이후 행동, 비용 지속성의 문제로 이어집니다. 그래서 이 글은 ${keywords[0]}만 따로 보지 않고 ${keywords[1]}, ${keywords[2]}까지 묶어서 설명합니다. 글을 읽고 바로 제품을 고르기보다, 우리 집이나 기관에서 감당할 수 있는 운영 기준을 먼저 정하는 데 초점을 둡니다.`,
    `${josa(main, '을/를')} 고민할 때 가장 흔한 실수는 기능이 많은 제품을 좋은 제품으로 착각하는 것입니다. 돌봄로봇은 생활 속에 들어오는 기기라서 ${keywords[0]}, ${keywords[1]}, ${josa(keywords[2], '이/가')} 모두 맞아야 오래 씁니다. 아래 내용은 보호자와 담당자가 같은 기준으로 이야기할 수 있도록 질문, 표, 체크리스트, FAQ 순서로 구성했습니다.`,
  ]
  return variants[index % variants.length]
}

function decisionTable(main, keywords, sectionLabel) {
  return `| 판단 기준 | 바로 확인할 질문 | 기록할 내용 | 다시 볼 시점 |
|---|---|---|---|
| ${keywords[0]} | ${josa(main, '이/가')} 지금 필요한 이유가 분명한가 | 현재 불편, 위험 신호, 확인 주기 | 검토 시작 전 |
| ${keywords[1]} | 알림을 받으면 누가 어떤 행동을 하는가 | 연락 순서, 방문 가능 시간, 미응답 기준 | 첫 1주 |
| ${keywords[2]} | 비용이나 동의 범위가 설명 가능한가 | 본인부담, 데이터 처리, 반납 조건 | 신청 전 |
| ${sectionLabel} | 글을 읽은 뒤 바로 결정해도 되는가 | 보류 이유와 다음 확인 항목 | 비교 후 |`
}

function searchIntentTable(main, keywords) {
  return `| 검색 의도 | 먼저 볼 기준 | 놓치기 쉬운 부분 |
|---|---|---|
| ${josa(main, '이/가')} 우리 상황에 맞는지 알고 싶다 | ${keywords[0]}와 현재 생활 패턴 | 제품 기능만 보고 결정 |
| 비용과 지원 가능성을 함께 보고 싶다 | ${keywords[1]}, ${keywords[2]}, 공식 공고 | 보조금만 보고 총비용 누락 |
| 설치 뒤 관리가 걱정된다 | ${keywords[3]}와 담당자 변경 기준 | 알림 책임자 미지정 |
| 어르신이 거부할까 걱정된다 | 설명 방식과 적응 기간 | 한 번에 모든 기능 켜기 |`
}

function checklist(main, keywords) {
  return `- [ ] ${josa(main, '을/를')} 찾는 이유를 가족 또는 담당자와 한 문장으로 적었다
- [ ] ${keywords[0]} 확인 주기와 책임자를 정했다
- [ ] ${keywords[1]} 알림을 받았을 때의 연락 순서를 정했다
- [ ] ${keywords[2]} 비용, 지원 조건, 동의 범위를 공식 안내에서 확인했다
- [ ] ${keywords[3]} 기록을 어디에 남길지 정했다
- [ ] 설치 후 2주 안에 조정할 항목을 미리 적었다`
}

function faq(main, keywords, row) {
  const persona = personaName(row.target_persona)
  return `### Q. ${main}은 제품 기능만 비교하면 충분한가요?

A. 충분하지 않습니다. ${keywords[0]}, ${keywords[1]}, ${keywords[2]}가 실제 행동으로 이어져야 합니다. 기능은 출발점이고, 보호자 또는 담당자가 확인할 수 있는 운영 기준이 있어야 돌봄 공백을 줄일 수 있습니다.

### Q. ${main}은 처음부터 모든 기능을 켜는 편이 좋나요?

A. 보통은 아닙니다. 첫 1~2주는 꼭 필요한 알림부터 켜고 어르신 반응과 ${persona}의 확인 부담을 봐야 합니다. 불필요한 알림이 많으면 중요한 신호까지 놓칠 수 있습니다.

### Q. ${main}에 지원사업이나 보조금이 있으면 바로 신청해도 되나요?

A. 신청 전에 대상 조건, 본인부담, 반납 조건, 설치 가능 지역을 다시 봐야 합니다. 같은 이름의 사업이라도 지자체와 운영 기관에 따라 접수 방식이 달라질 수 있습니다.

### Q. ${main}을 두고 가족끼리 의견이 다르면 무엇을 먼저 정해야 하나요?

A. 비용보다 확인 책임자를 먼저 정하세요. 누가 알림을 받고, 누가 방문하며, 미응답 때 누구에게 넘어가는지가 정해지면 제품 선택도 훨씬 쉬워집니다.`
}

function scenario(row, main, keywords, index) {
  const persona = personaName(row.target_persona)
  const variants = [
    `예를 들어 부모님이 혼자 지내는 시간이 길다면 ${josa(keywords[0], '은/는')} 매일 확인할 신호, ${josa(keywords[1], '은/는')} 가족이 실제로 받을 알림, ${josa(keywords[2], '은/는')} 비용과 동의 문제로 나뉩니다. 이 세 가지를 분리하면 "좋은 제품"보다 "우리 가족이 꾸준히 운영할 수 있는 방식"이 먼저 보입니다.`,
    `기관에서 검토한다면 ${josa(keywords[0], '은/는')} 이용자별 반응, ${josa(keywords[1], '은/는')} 담당자 교대 시 인수인계, ${josa(keywords[2], '은/는')} 보호자 설명 자료와 연결됩니다. ${persona}가 바뀌어도 같은 기준으로 기록을 볼 수 있어야 도입 효과를 설명할 수 있습니다.`,
    `현장에서 자주 생기는 문제는 설치 당일보다 설치 후 2주 뒤에 드러납니다. ${josa(keywords[0], '이/가')} 기대와 다르거나, ${keywords[1]} 알림이 너무 많거나, ${keywords[2]} 조건을 가족이 뒤늦게 알게 되는 식입니다. 그래서 처음부터 조정 가능한 항목을 따로 적어 두는 편이 좋습니다.`,
  ]
  return variants[index % variants.length]
}

function sourceBlock(sourceName, sourceUrl) {
  return `:::tip
지원 조건, 개인정보 처리, 보조금, 접수 일정은 바뀔 수 있습니다. 신청, 구매, 계약 전에는 [${sourceName}](${sourceUrl})와 거주지 지자체 공고, 제조사 안내를 함께 확인하세요.
:::`
}

function internalLinkBlock(row) {
  const links = internalLinks[row.category] ?? internalLinks.guide
  return `${links.map(([label, href]) => `[${label}](${href})`).join(', ')}에서 같은 주제를 이어서 확인할 수 있습니다. 기능을 먼저 좁히려면 ${formatLink(links[1])}를 보고, 비용이나 제도 조건이 중요하면 [지원사업 확인](/support)을 먼저 보세요. 실제 설치 흐름은 ${formatLink(links[0])}에서 단계별로 확인하는 편이 안전합니다.`
}

function formatLink(link) {
  if (!link) return '[관련 블로그](/blog)'
  return `[${link[0]}](${link[1]})`
}

function buildPost(row, index) {
  const main = normalizeMain(row.title_ko)
  const keywords = inferKeywords(row, main)
  const [sourceName, sourceUrl] = sourceFor(row, main, keywords)
  const [sectionA, sectionB, sectionC] = sectionSet(index)
  const subtitle = `${josa(main, '과/와')} ${keywords[0]}, ${josa(keywords[1], '을/를')} 함께 보는 2026년 실전 가이드`
  const summary = `${josa(main, '을/를')} 검토하는 보호자와 담당자가 ${keywords[0]}, ${keywords[1]}, ${keywords[2]} 기준으로 바로 판단할 수 있도록 정리했습니다.`
  const body = `# ${row.title_ko}

${introVariant(row, main, keywords, sourceName, index)}

:::key
${josa(main, '의/의')} 핵심은 모델명이 아니라 담당자, 알림 이후 행동, 공식 조건입니다. 글을 읽은 뒤 바로 결정하지 말고 아래 표와 체크리스트를 먼저 채워 보세요.
:::

## ${main}: ${sectionA}

${intentLine(row, main, keywords)}

${scenario(row, main, keywords, index)}

## ${main} 판단표: ${keywords[0]}부터 ${keywords[2]}까지

${decisionTable(main, keywords, sectionA)}

위 표에서 빈칸이 많다면 아직 구매나 신청 단계가 아닙니다. 돌봄로봇은 설치보다 운영이 더 중요하기 때문에, 누가 확인하고 어떤 상황에서 연락할지 정해져야 합니다. 특히 ${josa(keywords[1], '은/는')} 보호자의 안심과 연결되지만 어르신에게는 부담으로 느껴질 수도 있습니다. 그래서 설명 방식, 알림 강도, 공유 범위를 함께 정해야 합니다.

## ${keywords[0]} 기준으로 보는 실제 적용 장면

가정에서는 ${josa(keywords[0], '이/가')} 부모님의 생활 리듬과 맞는지 먼저 봐야 합니다. 기관에서는 같은 기준을 여러 이용자에게 적용할 수 있는지 확인해야 합니다. 지자체 사업이라면 민원이나 성과 보고에서 설명 가능한지도 중요합니다. 이 단계에서 제품명, 가격, 보조금, 설치 방법을 한꺼번에 보려고 하면 판단이 흐려집니다.

### ${main}: 가족 보호자가 볼 질문

부모님이 불편해할 기능은 무엇인지, 알림을 받을 사람이 실제로 대응할 수 있는지, 형제자매 사이에 정보 공유 범위가 합의됐는지 확인하세요. ${josa(main, '은/는')} 기술 문제가 아니라 가족의 운영 방식 문제로 이어지는 경우가 많습니다.

### ${main}: 기관 담당자가 볼 질문

담당자가 바뀌어도 같은 방식으로 확인 가능한지, 보호자 문의에 같은 기준으로 답할 수 있는지, 설치 후 조정 기록을 남길 수 있는지 봐야 합니다. ${josa(keywords[2], '이/가')} 문서화되지 않으면 좋은 기능도 현장에서 유지되기 어렵습니다.

## ${sectionB}: 설치 전후 체크리스트

${checklist(main, keywords)}

체크리스트는 형식이 아니라 갈등을 줄이는 장치입니다. 비용, 알림, 개인정보, 담당자 변경은 설치 뒤에 바꾸기 어렵거나 가족 사이에서 해석이 갈리기 쉽습니다. 그래서 신청 전 한 번, 설치 직후 한 번, 2주 사용 후 한 번 다시 확인하는 흐름이 좋습니다.

${sourceBlock(sourceName, sourceUrl)}

## ${main}을 검색한 사람이 자주 놓치는 부분

첫째, 알림이 많으면 더 안전하다고 생각하기 쉽습니다. 실제로는 불필요한 알림이 쌓이면 중요한 신호를 놓칠 수 있습니다. 둘째, 보조금이 있으면 부담이 없다고 생각하기 쉽습니다. 하지만 월 이용료, 소모품, 통신비, 반납 조건은 따로 확인해야 합니다. 셋째, 어르신의 거부감을 단순 적응 문제로 넘기기 쉽습니다. 설명 방식과 선택권을 주지 않으면 장기 사용률이 떨어질 수 있습니다.

## 검색 의도별 빠른 판단표: ${main}

${searchIntentTable(main, keywords)}

이 표는 검색자가 바로 다음 행동으로 넘어갈 수 있게 만든 요약입니다. 단순히 "좋다/나쁘다"를 정하는 것이 아니라, 현재 상황에서 어떤 기준을 먼저 확인해야 하는지 보여 줍니다. 이 구조가 있어야 AI 답변형 검색에서도 핵심 문장이 분리되어 인용되기 쉽습니다.

## ${keywords[1]}와 ${keywords[3]}를 같이 봐야 하는 이유

${keywords[1]}만 보면 기능 문제처럼 보이지만, ${keywords[3]}까지 보면 운영 문제가 드러납니다. 예를 들어 알림 기능이 좋아도 확인자가 정해져 있지 않으면 대응이 늦어질 수 있습니다. 반대로 기능이 단순해도 기록 위치와 연락 순서가 명확하면 가족의 불안은 크게 줄어듭니다. 돌봄로봇 선택에서는 기능 수보다 지속 가능한 운영 기준이 더 중요합니다.

## ${main}에서 ${keywords[4]}까지 확인하면 달라지는 것

${josa(keywords[4], '은/는')} 처음 검색할 때는 부가 항목처럼 보일 수 있습니다. 그러나 실제 운영에서는 이 항목이 오래 쓰는지, 중간에 포기하는지를 가르는 경우가 많습니다. 가족 보호자는 알림을 받는 횟수와 대응 부담을 확인해야 하고, 기관 담당자는 여러 이용자의 기록을 같은 양식으로 남길 수 있는지 봐야 합니다. 지자체나 복지 현장에서는 민원 대응과 사업 평가까지 연결되므로 "좋아 보인다"는 인상보다 설명 가능한 기준이 필요합니다.

이 부분을 따로 보는 이유는 단순합니다. ${josa(main, '이/가')} 한 번 설치되면 생활 공간, 가족 연락망, 담당자 업무 흐름 안으로 들어옵니다. 처음에는 작은 설정처럼 보인 항목도 한 달 뒤에는 반복 업무가 됩니다. 그래서 ${keywords[4]}를 설치 전 문서에 남기고, 설치 후 2주 안에 실제 기록과 비교하는 절차가 필요합니다.

## ${sectionC}: 2주 뒤 다시 점검할 항목

설치 후 2주는 실제 반응을 보는 기간입니다. 어르신이 어떤 알림을 불편해하는지, 보호자가 어떤 알림을 놓치는지, 담당자가 기록을 남기기 쉬운지 확인해야 합니다. 이때 ${keywords[0]}, ${keywords[1]}, ${keywords[2]}를 다시 보면서 알림 강도와 공유 범위를 조정하면 장기 사용 가능성이 높아집니다.

## ${main} FAQ

${faq(main, keywords, row)}

## ${main} 관련 페이지

${internalLinkBlock(row)}

## 결론: ${main}은 기준을 정한 뒤 선택해야 합니다

${josa(main, '은/는')} 제품 하나로 끝나는 문제가 아닙니다. ${keywords[0]}, ${keywords[1]}, ${keywords[2]}를 어떤 순서로 확인하고 누가 책임질지 정해야 실제 돌봄 공백을 줄일 수 있습니다. 오늘 바로 할 일은 제품명을 고르는 것이 아니라 체크리스트의 빈칸을 채우는 것입니다. 그다음 공식 안내와 내부 링크를 따라가며 신청, 비교, 설치 준비를 같은 흐름에서 확인하세요.
`

  return {
    subtitle,
    summary,
    body_md: body,
    tags_json: JSON.stringify([...new Set([main, ...keywords, row.category].filter(Boolean))]),
    reading_time_minutes: Math.max(8, Math.round(body.length / 650)),
  }
}

function audit(row) {
  const body = String(row.body_md ?? '')
  const links = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
  const h2 = (body.match(/^## /gm) || []).length
  const h3 = (body.match(/^### /gm) || []).length
  const checks = (body.match(/- \[ \]/g) || []).length
  const tableSeparators = (body.match(/^\|---/gm) || []).length
  const callouts = (body.match(/^:::/gm) || []).length / 2
  const internal = links.filter((link) => link.startsWith('/')).length
  const out = links.filter((link) => link.startsWith('https://')).length
  let score = 100
  if (body.length < MIN_BODY_CHARS) score -= 25
  if (h2 < 8) score -= 10
  if (h3 < 3) score -= 8
  if (checks < 5) score -= 8
  if (tableSeparators < 2) score -= 6
  if (callouts < 2) score -= 5
  if (internal < 4) score -= 8
  if (out < 1) score -= 10
  if (bannedMarkers.some((marker) => body.includes(marker))) score -= 20
  if (/[가-힣]+(을을|를를|이가|가가|은은|는는)/.test(body)) score -= 8
  return { score: Math.max(0, score), chars: body.length, h2, h3, checks, tableSeparators, callouts, internal, out }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  const result = await client.execute('select slug,title_ko,subtitle,summary,body_md,category,target_persona,tags_json from blog_posts order by published_at, slug')
  const rows = result.rows
  let updated = 0
  const failures = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const next = buildPost(row, i)
    const check = audit(next)
    if (check.score < MIN_SCORE || check.chars < MIN_BODY_CHARS) {
      failures.push({ slug: row.slug, ...check })
      continue
    }
    await client.execute({
      sql: `update blog_posts set
        subtitle = ?,
        summary = ?,
        body_md = ?,
        tags_json = ?,
        reading_time_minutes = ?,
        updated_at = unixepoch()
      where slug = ?`,
      args: [
        next.subtitle,
        next.summary,
        next.body_md,
        next.tags_json,
        next.reading_time_minutes,
        row.slug,
      ],
    })
    updated += 1
  }

  const after = await client.execute('select slug,title_ko,subtitle,summary,body_md,category,target_persona,tags_json from blog_posts order by published_at, slug')
  const audits = after.rows.map((row) => ({ slug: row.slug, ...audit(row) }))
  const weak = audits.filter((item) => item.score < MIN_SCORE || item.chars < MIN_BODY_CHARS)
  const markerCounts = Object.fromEntries(bannedMarkers.map((marker) => [
    marker,
    after.rows.filter((row) => String(row.body_md ?? '').includes(marker)).length,
  ]))

  console.log(JSON.stringify({
    ok: failures.length === 0 && weak.length === 0,
    scanned: rows.length,
    updated,
    generationFailures: failures,
    weakAfter: weak.length,
    weakSample: weak.slice(0, 10),
    minScore: Math.min(...audits.map((item) => item.score)),
    minChars: Math.min(...audits.map((item) => item.chars)),
    avgChars: Math.round(audits.reduce((sum, item) => sum + item.chars, 0) / audits.length),
    markerCounts,
  }, null, 2))
} finally {
  client.close()
}
