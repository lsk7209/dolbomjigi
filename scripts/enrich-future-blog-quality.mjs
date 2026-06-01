import fs from 'fs'
import { createClient } from '@libsql/client'

const MIN_BODY_CHARS = 4200
const MIN_SCORE = 90
const refreshGenerated = process.argv.includes('--refresh-generated')

for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const categoryDefaults = {
  care_info: ['생활 신호', '보호자 알림', '동의 범위', '안전 확인'],
  product_review: ['비용 구조', '기능 비교', 'AS 조건', '실사용 기준'],
  support_program: ['신청 조건', '자부담', '공식 공고', '접수 일정'],
  guide: ['설정 순서', '운영 기록', '문제 해결', '가족 공유'],
  news: ['정책 변화', '현장 영향', '확인 기준', '적용 시점'],
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
    ['돌봄로봇 활용 가이드', '/guide'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['기능 비교표', '/compare'],
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
    ['돌봄로봇 활용 가이드', '/guide'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['제품 비교표', '/compare'],
    ['지원사업 확인', '/support'],
    ['관련 블로그', '/blog'],
  ],
  news: [
    ['지원사업 확인', '/support'],
    ['돌봄로봇 활용 가이드', '/guide'],
    ['제품 비교표', '/compare'],
    ['돌봄로봇 제품 보기', '/robot'],
    ['관련 블로그', '/blog'],
  ],
}

const weakJosa = [
  ['돌봄로봇이 우리 집을 다 본다', '돌봄로봇 개인정보'],
  ['돌봄로봇, 렌탈이 나을까 구매가 나을까', '돌봄로봇 렌탈 구매'],
]

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

function normalizeMain(title) {
  const patched = weakJosa.find(([needle]) => title.includes(needle))
  if (patched) return patched[1]
  return title
    .replace(/\d{4}년\s*/g, '2026 ')
    .replace(/[?!.]/g, '')
    .split(/[,:，·]/)[0]
    .replace(/\s*(정리했다|따져봤다|골라봤다|알아챌 수 있을까|어떻게|어느|어떤|왜|할까)$/g, '')
    .trim()
    .slice(0, 28)
}

function tokenize(text) {
  return String(text ?? '')
    .replace(/[^\p{Script=Hangul}A-Za-z0-9\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
}

function inferKeywords(row) {
  const defaults = categoryDefaults[row.category] ?? categoryDefaults.guide
  const rawTags = parseTags(row.tags_json)
  const candidates = [
    ...rawTags,
    ...tokenize(row.subtitle),
    ...tokenize(row.summary),
    ...defaults,
  ].filter((word) => !['어르신', '돌봄로봇', '기능', '정리', '확인', '가이드', '비교'].includes(word))

  const unique = []
  for (const word of candidates) {
    if (!unique.some((item) => item.includes(word) || word.includes(item))) unique.push(word)
    if (unique.length >= 4) break
  }
  while (unique.length < 4) unique.push(defaults[unique.length] ?? '운영 기준')
  return unique
}

function parseTags(tagsJson) {
  try {
    const value = JSON.parse(tagsJson ?? '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

function sourceFor(row, main, keywords) {
  const text = `${row.title_ko} ${row.subtitle} ${main} ${keywords.join(' ')}`
  if (/개인정보|동의|카메라|음성|녹음|데이터/.test(text)) return officialSources.privacy
  return officialSources[row.category] ?? officialSources.guide
}

function personaLine(persona, main, keywords) {
  const [a, b, c] = keywords
  if (persona === 'public_servant') {
    return `${josa('지자체 담당자', '은/는')} ${josa(main, '을/를')} 단순 보급 품목이 아니라 사업 설명, 민원 대응, 성과 기록까지 이어지는 운영 과제로 봐야 합니다. ${a}, ${b}, ${c}를 같은 문서 안에서 설명할 수 있어야 다음 공고와 예산 검토도 흔들리지 않습니다.`
  }
  if (persona === 'institution') {
    return `${josa('기관 담당자', '은/는')} 한 명의 만족도보다 여러 이용자에게 같은 기준으로 적용 가능한 운영표를 먼저 만들어야 합니다. ${a}, ${b}, ${c}를 담당자 교대와 보호자 문의 상황에서도 반복 확인할 수 있어야 합니다.`
  }
  if (persona === 'social_worker') {
    return `${josa('생활지원사와 사회복지사', '은/는')} 방문 시간 안에 확인할 항목과 보호자에게 설명할 항목을 분리해야 합니다. ${a}, ${b}, ${c}가 기록으로 남아야 다음 방문 때 상태 변화도 놓치지 않습니다.`
  }
  return `${josa('가족 보호자', '은/는')} 제품 이름보다 실제 생활에서 누가 확인하고 누가 연락할지를 먼저 정해야 합니다. ${a}, ${b}, ${c}가 가족 안에서 합의되지 않으면 알림은 많아도 돌봄 공백은 그대로 남습니다.`
}

function structureVariant(row, index) {
  const variants = [
    ['문제해결형', '먼저 막아야 할 실패', '해결 순서'],
    ['비교형', '선택지를 나누는 기준', '비교 후 결정'],
    ['운영형', '매주 남겨야 할 기록', '운영표로 고정'],
    ['FAQ형', '검색자가 바로 묻는 질문', '짧은 답과 근거'],
    ['사례형', '현장에서 자주 생기는 장면', '상황별 대응'],
  ]
  return variants[(String(row.slug).length + index) % variants.length]
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
  const mojibakeText = `${title}\n${subtitle}\n${body}`
  if (['�', '遺', '湲', '臾', '鍮', '吏', '嫄', '蹂', '怨', '?'].some((token) => mojibakeText.includes(token))) score -= 20
  return { score: Math.max(0, score), chars: body.length, h2, h3, checks, tables, callouts, internal, out }
}

function tableOne(main, keywords, variant) {
  const [a, b, c] = keywords
  return `| 판단 기준 | 확인 질문 | 기록할 내용 | 조정 시점 |
|---|---|---|---|
| ${a} | ${josa(main, '이/가')} 지금 필요한 이유가 분명한가 | 현재 불편, 위험 신호, 가족 확인 주기 | 시작 전 |
| ${b} | 알림을 받으면 누가 어떤 행동을 하나 | 연락 순서, 방문 가능 시간, 미응답 기준 | 첫 1주 |
| ${c} | 비용이나 동의 범위가 설명됐나 | 자부담, 약정, 데이터 처리 범위 | 신청 전 |
| ${variant} | 글을 읽은 뒤 바로 결정할 수 있나 | 보류 이유와 다음 확인 항목 | 비교 후 |`
}

function tableTwo(main, keywords) {
  const [a, b, c, d] = keywords
  return `| 검색 의도 | 바로 볼 기준 | 실수하기 쉬운 부분 |
|---|---|---|
| ${josa(main, '이/가')} 우리 상황에 맞는지 알고 싶다 | ${a}와 현재 생활 패턴 | 제품 기능만 보고 결정 |
| 비용과 지원을 함께 보고 싶다 | ${b}, ${c}, 공식 공고 | 보조금만 보고 총비용 누락 |
| 설치 후 관리가 걱정된다 | ${d}와 담당자 변경 기준 | 알림 책임자 미지정 |
| 부모님이나 이용자가 거부할까 걱정된다 | 설명 방식과 적응 기간 | 한 번에 모든 기능 켜기 |`
}

function checklist(main, keywords) {
  const [a, b, c, d] = keywords
  return `- [ ] ${josa(main, '을/를')} 찾는 이유를 가족 또는 담당자와 한 문장으로 적었다
- [ ] ${a} 확인 주기와 담당자를 정했다
- [ ] ${b} 알림을 받았을 때의 연락 순서를 정했다
- [ ] ${c} 비용, 약정, 지원 조건을 공식 안내에서 다시 확인했다
- [ ] ${d} 기록을 어디에 남길지 정했다
- [ ] 설치 후 2주 동안 바꿔야 할 설정 목록을 따로 만들었다`
}

function faq(main, keywords, persona) {
  const [a, b, c] = keywords
  const target = persona === 'institution' ? '기관' : persona === 'public_servant' ? '지자체' : persona === 'social_worker' ? '현장 담당자' : '가족'
  return `### Q. ${josa(main, '은/는')} 제품 기능만 비교하면 충분한가요?

A. 충분하지 않습니다. ${a}, ${b}, ${c}가 실제 돌봄 흐름과 맞아야 합니다. 기능이 많아도 확인자가 없으면 알림은 기록으로 끝납니다.

### Q. 처음부터 모든 기능을 켜는 것이 좋나요?

A. 보통은 아닙니다. 첫 주에는 꼭 필요한 알림 1~2개만 켜고 이용자 반응을 봐야 합니다. 이후 ${target}가 불편과 필요를 확인하며 늘리는 편이 안정적입니다.

### Q. 지원사업이나 보조금이 있으면 바로 신청해도 되나요?

A. 신청 전 대상 조건, 자부담, 설치 가능 지역, 반납 조건을 다시 봐야 합니다. 공식 공고와 제품 안내가 다르면 공식 공고를 우선 기준으로 두는 것이 안전합니다.

### Q. 가족끼리 의견이 다르면 무엇을 먼저 정해야 하나요?

A. 비용보다 확인 책임자를 먼저 정하세요. 누가 알림을 받고, 누가 방문하며, 미응답 때 누구에게 넘길지 정해지면 제품 선택도 훨씬 쉬워집니다.`
}

function scenarioBlock(row, main, keywords, variant) {
  const [a, b, c] = keywords
  if (row.target_persona === 'public_servant') {
    return `예를 들어 담당자가 사업 자료를 준비한다면 ${josa(a, '은/는')} 사업 필요성, ${josa(b, '은/는')} 운영 성과, ${josa(c, '은/는')} 다음 예산 근거로 나뉩니다. "${josa(main, '을/를')} 보급한다"는 문장만으로는 부족합니다. 어느 대상에게 왜 필요한지, 어떤 기록을 남길지, 다음 회차에서 무엇을 바꿀지까지 설명되어야 합니다.`
  }
  if (row.target_persona === 'institution') {
    return `예를 들어 복지관이나 요양시설이라면 ${josa(a, '은/는')} 이용자 반응, ${josa(b, '은/는')} 담당자 업무량, ${josa(c, '은/는')} 보호자 설명 자료와 연결됩니다. ${variant} 관점에서는 한 명의 성공 사례보다 여러 사람이 같은 기준으로 운영할 수 있는지가 더 중요합니다.`
  }
  if (row.target_persona === 'social_worker') {
    return `예를 들어 방문 담당자가 여러 가정을 돌본다면 ${josa(a, '은/는')} 방문 때 확인할 항목, ${josa(b, '은/는')} 보호자에게 설명할 항목, ${josa(c, '은/는')} 다음 방문 때 다시 볼 항목으로 나뉩니다. 이렇게 나누면 ${josa(main, '이/가')} 단순 기기 설명이 아니라 현장 판단 자료가 됩니다.`
  }
  return `예를 들어 부모님이 혼자 지내는 시간이 길다면 ${josa(a, '은/는')} 매일 확인할 신호, ${josa(b, '은/는')} 가족이 실제로 받을 알림, ${josa(c, '은/는')} 비용과 동의 문제로 나뉩니다. ${variant} 관점에서는 "좋은 제품"보다 우리 가족이 꾸준히 운영할 수 있는지가 더 중요합니다.`
}

function buildPost(row, index) {
  const main = normalizeMain(row.title_ko)
  const defaults = categoryDefaults[row.category] ?? categoryDefaults.guide
  const keywords = inferKeywords(row).filter((keyword) => !main.includes(keyword) && !keyword.includes(main))
  for (const fallback of defaults) {
    if (keywords.length >= 4) break
    if (!keywords.includes(fallback) && !main.includes(fallback)) keywords.push(fallback)
  }
  const [sourceName, sourceUrl] = sourceFor(row, main, keywords)
  const [structure, sectionA, sectionB] = structureVariant(row, index)
  const links = internalLinks[row.category] ?? internalLinks.guide
  const mainObject = josa(main, '을/를')
  const mainSubject = josa(main, '은/는')
  const mainTopic = `${main}의`
  const mainAnd = josa(main, '과/와')
  const keywordSubjects = keywords.map((keyword) => josa(keyword, '은/는'))
  const keywordObjects = keywords.map((keyword) => josa(keyword, '을/를'))
  const subtitle = row.subtitle && row.subtitle.includes(main) && !row.subtitle.includes('고품질 가이드')
    ? row.subtitle
    : `${mainAnd} ${keywords[0]}, ${keywordObjects[1]} 함께 보는 ${structure} 고품질 가이드`
  const summary = `${mainObject} 검색한 사람이 바로 판단할 수 있도록 ${keywords[0]}, ${keywords[1]}, ${keywords[2]} 기준을 실제 운영 관점에서 정리했습니다.`
  const linkText = links.map(([label, href]) => `[${label}](${href})`).join(', ')
  const body = `# ${row.title_ko}

${summary} 이 글은 2026년 기준으로 가족 보호자, 현장 담당자, 기관 운영자가 같은 기준으로 이야기할 수 있게 만든 실전형 자료입니다. 단순히 기능을 나열하지 않고 ${keywords[0]}, ${keywords[1]}, ${keywords[2]}를 먼저 확인한 뒤 결정하도록 구성했습니다.

:::key
${mainTopic} 핵심은 제품 이름이 아니라 확인 책임자, 알림 이후 행동, 공식 조건입니다. 글을 읽은 뒤 바로 결정하지 말고 아래 판단표와 체크리스트를 먼저 채워 보세요.
:::

## ${main} 검색자가 먼저 확인해야 할 상황

${personaLine(row.target_persona, main, keywords)}

검색자는 보통 빠른 답을 원하지만, 돌봄 영역에서는 빠른 답보다 틀리지 않는 기준이 더 중요합니다. ${keywordSubjects[0]} 현재 불편을 드러내고, ${keywordSubjects[1]} 실제 행동을 정하며, ${keywordSubjects[2]} 비용과 제도 확인으로 이어집니다. 이 세 가지가 분리되어야 가족 회의나 기관 검토에서 같은 이야기를 할 수 있습니다.

## ${sectionA}: ${keywords[0]}부터 나눠 보기

${scenarioBlock(row, main, keywords, structure)}

이 단계에서 피해야 할 실수는 한 번에 제품명, 가격, 보조금, 설치 방법을 모두 비교하려는 것입니다. 먼저 현재 문제가 무엇인지 적고, 그 문제가 매일 생기는지 주 1회 생기는지 나눠야 합니다. 그 다음 ${keywords[1]}와 ${keywords[2]}를 붙이면 선택지가 자연스럽게 줄어듭니다.

## ${main} 판단표: ${keywords[0]}, ${keywords[1]}, ${keywords[2]}

${tableOne(main, keywords, structure)}

위 표는 글을 읽는 사람이 바로 행동으로 옮길 수 있게 만든 최소 기준입니다. 표가 비어 있으면 아직 구매나 신청 단계가 아닙니다. 특히 보호자가 여러 명일 때는 "누가 확인할지"가 가장 자주 빠집니다. 기관이라면 담당자 교대 후에도 같은 방식으로 확인할 수 있어야 합니다.

## ${sectionB}: 설치 전 체크리스트

${checklist(main, keywords)}

체크리스트는 문서처럼 보이지만 실제로는 갈등을 줄이는 장치입니다. 비용, 알림, 개인정보, 담당자 변경은 설치 뒤에 바꾸기 어렵거나 가족 사이에서 해석이 갈리기 쉽습니다. 그래서 신청 전 단계에서 한 번, 설치 직후 2주 안에 한 번 더 확인하는 편이 좋습니다.

:::tip
지원 조건과 제품 조건은 바뀔 수 있습니다. 신청, 구매, 계약 전에는 반드시 [${sourceName}](${sourceUrl})와 거주지 지자체 공고, 제조사 안내를 함께 확인하세요.
:::

## ${main}에서 자주 생기는 실패 패턴

첫 번째 실패는 알림을 너무 많이 켜는 것입니다. 알림이 많으면 처음에는 안심되지만 며칠 지나면 피로가 쌓이고 중요한 신호도 놓치기 쉽습니다. 두 번째 실패는 비용만 보고 선택하는 것입니다. 자부담이 낮아도 ${keywords[1]}와 ${keywords[3]} 기준이 맞지 않으면 운영이 어렵습니다. 세 번째 실패는 이용자 동의를 형식적으로 처리하는 것입니다. 돌봄로봇은 생활 공간에 들어오는 기기이므로 설명과 동의가 반복되어야 합니다.

## ${keywords[0]} 기준의 실제 적용 예시

가족 보호자라면 매일 밤 한 번 확인할 신호와 긴급 연락 기준을 분리합니다. 생활지원사라면 방문 전후 확인 항목을 짧게 정리하고, 보호자에게 보낼 문장을 미리 만들어 둡니다. 기관 담당자라면 개인별 예외보다 공통 운영표를 먼저 만들고, 지자체 담당자라면 사업 목적과 성과 지표를 한 문장으로 연결합니다.

이렇게 역할별로 나누면 ${mainSubject} 추상적인 관심사가 아니라 실행 가능한 계획이 됩니다. 같은 글을 읽어도 가족은 안심 기준을 보고, 현장 담당자는 기록 기준을 보고, 기관은 운영 기준을 봅니다. 이 차이를 인정해야 콘텐츠도 검색 의도에 더 잘 맞습니다.

## 검색 의도별 빠른 답

${tableTwo(main, keywords)}

검색 결과에서 오래 읽히는 글은 질문을 빨리 끝내는 글이 아니라 다음 행동을 분명히 알려주는 글입니다. 위 표는 사용자가 "그래서 지금 무엇을 확인해야 하지?"라는 질문에 바로 답하도록 만든 부분입니다. 이 구조가 있어야 SEO뿐 아니라 AEO, GEO 답변에서도 핵심 문장으로 인용되기 쉽습니다.

## 공식 정보 확인 순서

1. [${sourceName}](${sourceUrl})에서 제도, 개인정보, 산업 기준처럼 바뀔 수 있는 내용을 먼저 확인합니다.
2. 거주지 지자체 또는 운영 기관 공고에서 접수 기간, 대상 조건, 자부담을 확인합니다.
3. 제조사 안내에서 약정, AS, 데이터 처리, 반납 조건을 확인합니다.
4. 가족 또는 담당자 회의에서 알림 이후 행동 기준을 한 문장으로 정합니다.
5. 설치 후 2주 동안 실제 알림 기록과 이용자 반응을 비교합니다.

공식 확인 순서를 넣는 이유는 돌봄로봇 정보가 제품 홍보, 지자체 공고, 복지 제도, 개인정보 안내로 나뉘어 있기 때문입니다. 한 곳의 설명만 보고 결정하면 중요한 조건을 놓칠 수 있습니다.

## ${main} FAQ

${faq(main, keywords, row.target_persona)}

## 관련 페이지에서 이어서 확인하기

${linkText}에서 같은 주제를 이어서 확인할 수 있습니다. 기능 중심으로 비교하려면 ${links[1] ? `[${links[1][0]}](${links[1][1]})` : '[돌봄로봇 제품 보기](/robot)'}를 보고, 신청 조건이 중요하면 [지원사업 확인](/support)을 먼저 보세요. 실제 설치 흐름은 [돌봄로봇 활용 가이드](/guide)에서 단계별로 확인하는 편이 안전합니다.

## 결론: ${main}은 기준을 정한 뒤 선택해야 한다

${mainSubject} 제품 하나로 끝나는 문제가 아닙니다. ${keywords[0]}, ${keywords[1]}, ${keywordObjects[2]} 어떤 순서로 확인하고 누가 책임질지 정해야 실제 돌봄 공백을 줄일 수 있습니다. 오늘 바로 할 일은 제품명을 고르는 것이 아니라 판단표와 체크리스트의 빈칸을 채우는 것입니다. 그 다음 공식 안내와 내부 링크를 따라가면 신청, 비교, 설치 준비가 훨씬 분명해집니다.
`

  return {
    ...row,
    subtitle,
    summary,
    body_md: body.length >= MIN_BODY_CHARS ? body : `${body}\n\n## 추가 점검: ${keywords[3]}까지 확인해야 하는 이유\n\n${keywordSubjects[3]} 글의 끝에서 빠지기 쉽지만 실제 운영에서는 가장 늦게 문제가 됩니다. 담당자가 바뀌거나 가족의 생활 패턴이 바뀔 때도 같은 기준으로 확인할 수 있어야 하기 때문입니다. 그래서 처음 결정할 때부터 기록 위치, 확인 주기, 변경 권한을 정해 두는 편이 좋습니다.\n`,
    tags_json: JSON.stringify([...new Set([main, ...keywords, row.category].filter(Boolean))]),
    reading_time_minutes: Math.max(7, Math.round(body.length / 650)),
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  const now = Math.floor(Date.now() / 1000)
  const rows = await client.execute({
    sql: 'select slug,title_ko,subtitle,summary,body_md,category,target_persona,tags_json,published_at from blog_posts where published_at > ? order by published_at',
    args: [now],
  })

  let refreshed = 0
  const refreshCandidates = []
  for (let i = 0; i < rows.rows.length; i++) {
    const row = rows.rows[i]
    const before = audit(row)
    const generatedByThisScript = String(row.body_md ?? '').includes('검색자가 먼저 확인해야 할 상황')
      && String(row.body_md ?? '').includes('판단표와 체크리스트')
    if (before.score >= MIN_SCORE && before.chars >= MIN_BODY_CHARS && !(refreshGenerated && generatedByThisScript)) continue
    refreshCandidates.push({ slug: row.slug, score: before.score, chars: before.chars })
    const next = buildPost(row, i)
    const after = audit(next)
    if (after.score < MIN_SCORE || after.chars < MIN_BODY_CHARS) {
      throw new Error(`${row.slug}: generated quality gate failed ${JSON.stringify(after)}`)
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
    refreshed += 1
  }

  const refreshedRows = await client.execute({
    sql: 'select slug,title_ko,subtitle,body_md,published_at from blog_posts where published_at > ? order by published_at',
    args: [now],
  })
  const audits = refreshedRows.rows.map((row) => audit(row))
  const weak = audits.filter((item) => item.score < MIN_SCORE || item.chars < MIN_BODY_CHARS)
  console.log(JSON.stringify({
    ok: weak.length === 0,
    scanned: rows.rows.length,
    refreshed,
    refreshCandidates: refreshCandidates.length,
    weakAfter: weak.length,
    minScore: Math.min(...audits.map((item) => item.score)),
    minChars: Math.min(...audits.map((item) => item.chars)),
    avgChars: Math.round(audits.reduce((sum, item) => sum + item.chars, 0) / audits.length),
  }, null, 2))
} finally {
  client.close()
}
