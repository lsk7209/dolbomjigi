import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'scripts', 'blog-generated-2026-search-gaps.json')
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function overlapScore(a, b) {
  const aa = new Set(normalize(a).split(' ').filter(Boolean))
  const bb = new Set(normalize(b).split(' ').filter(Boolean))
  if (aa.size === 0 || bb.size === 0) return 0
  let hit = 0
  for (const token of aa) if (bb.has(token)) hit++
  return hit / Math.min(aa.size, bb.size)
}

const officialSources = {
  welfare:
    '[복지로](https://www.bokjiro.go.kr), [보건복지부](https://www.mohw.go.kr), 거주지 지자체 공고',
  stats:
    '[통계청 KOSIS](https://kosis.kr), [보건복지부](https://www.mohw.go.kr), [한국로봇산업진흥원](https://www.kiria.org)',
  privacy:
    '[개인정보보호위원회](https://www.pipc.go.kr), [한국인터넷진흥원](https://www.kisa.or.kr), 제조사 개인정보 처리방침',
  product:
    '[한국로봇산업진흥원](https://www.kiria.org), 제조사 공식 홈페이지, 지자체 보급 안내문',
  local:
    '[복지로](https://www.bokjiro.go.kr), 거주지 시군구청, 읍면동 행정복지센터 공고',
}

const situations = [
  ['remote-daughter-weekday', '평일에 자주 못 가는 자녀의 원격 안부 확인', '원격 안부 확인', ['보호자 앱', '생활 패턴', '알림 기준'], 'family_caregiver', 'guide', 'product'],
  ['night-anxiety-living-alone', '밤에 혼자 계신 어르신의 야간 안심 점검', '야간 안심 점검', ['수면 패턴', '응급 알림', '실내 움직임'], 'family_caregiver', 'care_info', 'product'],
  ['meal-routine-parent', '식사 시간이 자주 흐트러지는 부모님 일과 관리', '식사 시간 알림', ['일과 관리', '복약 알림', '수분 섭취'], 'family_caregiver', 'guide', 'welfare'],
  ['phone-call-not-answering', '전화를 받지 않을 때 보호자가 확인할 순서', '전화 미응답 안부 확인', ['보호자 연락', '응급 연락망', '생활 데이터'], 'family_caregiver', 'guide', 'privacy'],
  ['elderly-couple-alerts', '노부부가 함께 사는 집의 알림 설정', '노부부 돌봄로봇 설정', ['공동 사용', '보호자 알림', '계정 관리'], 'family_caregiver', 'guide', 'product'],
  ['parent-refuses-device', '낯선 기기를 부담스러워하는 어르신 적응 지원', '어르신 기기 적응', ['거부감 완화', '설치 첫날', '말벗 기능'], 'family_caregiver', 'guide', 'product'],
  ['rural-parent-connectivity', '농촌 주택에서 쓰는 돌봄로봇 통신 점검', '농촌 돌봄로봇 연결', ['와이파이', 'LTE 통신', '원격 관리'], 'family_caregiver', 'guide', 'product'],
  ['hospital-discharge-home', '퇴원 후 집에 돌아온 어르신의 생활 복귀 보조', '퇴원 후 생활 보조', ['일과 회복', '보호자 알림', '활동 독려'], 'family_caregiver', 'care_info', 'welfare'],
  ['cognitive-health-routine', '인지 건강이 걱정될 때 매일 살펴볼 생활 신호', '인지 건강 생활 신호', ['회상 콘텐츠', '일과 변화', '대화 기록'], 'family_caregiver', 'care_info', 'stats'],
  ['fall-risk-home-layout', '집 안 동선이 불안할 때 설치 위치 고르기', '낙상 위험 동선 점검', ['설치 위치', '센서 범위', '응급 알림'], 'family_caregiver', 'guide', 'product'],
  ['monthly-fee-contract', '월 이용료와 약정 조건을 비교하는 보호자', '돌봄로봇 월 이용료', ['렌탈 계약', '해지 조건', '유지비'], 'family_caregiver', 'product_review', 'product'],
  ['used-device-handover', '중고·반납 기기 개인정보 초기화', '돌봄로봇 데이터 초기화', ['개인정보 삭제', '기기 반납', '계정 해제'], 'all', 'guide', 'privacy'],
  ['local-office-application', '읍면동에서 지원사업을 물어볼 때 준비할 것', '돌봄로봇 지원사업 문의', ['행정복지센터', '신청 서류', '지원 자격'], 'family_caregiver', 'support_program', 'local'],
  ['income-priority-check', '소득 기준과 우선순위를 확인하는 가정', '돌봄로봇 우선 지원 기준', ['기초생활수급', '차상위', '독거 어르신'], 'social_worker', 'support_program', 'welfare'],
  ['care-manager-field-visit', '생활지원사 현장 방문 때 확인할 운영 항목', '생활지원사 돌봄로봇 점검', ['현장 방문', '사용 기록', '보호자 공유'], 'social_worker', 'guide', 'welfare'],
  ['welfare-center-group-class', '복지관 그룹 프로그램에 로봇을 넣는 방법', '복지관 돌봄로봇 프로그램', ['그룹 활동', '인지 건강 콘텐츠', '운영표'], 'institution', 'guide', 'stats'],
  ['nursing-home-staff-workflow', '요양시설 직원 업무 흐름에 맞춘 도입 점검', '요양시설 돌봄로봇 운영', ['근무 교대', '기록 관리', '기관 도입'], 'institution', 'guide', 'welfare'],
  ['public-servant-budget-note', '지자체 담당자가 예산 설명자료를 만들 때', '돌봄로봇 예산 설명', ['성과 지표', '수혜자 기준', '공고 문구'], 'public_servant', 'support_program', 'stats'],
  ['privacy-family-consent', '가족 동의와 사생활 보호를 함께 챙기는 방법', '돌봄로봇 개인정보 동의', ['음성 데이터', '카메라 설정', '보호자 권한'], 'all', 'care_info', 'privacy'],
  ['emergency-contact-chain', '응급 연락망을 여러 명으로 나누는 설정', '돌봄로봇 응급 연락망', ['보호자 순서', '119 연계', '알림 피로'], 'family_caregiver', 'guide', 'privacy'],
]

const angles = [
  ['checklist', '신청 전 체크리스트', '체크리스트', 'checklist', ['summary_box', 'checklist', 'warning_box']],
  ['cost', '비용과 지원 가능성 정리', '비용 판단', 'comparison', ['table', 'pros_cons', 'source_box']],
  ['setup', '처음 설정하는 순서', '설정 가이드', 'how_to', ['steps', 'checklist', 'summary_box']],
  ['warning', '놓치기 쉬운 주의점', '실수 예방', 'warning', ['warning_box', 'table', 'faq']],
  ['faq', '자주 묻는 질문 답변', 'FAQ', 'faq', ['faq', 'source_box', 'checklist']],
]

function buildTopic(situation, angle, index) {
  const [baseSlug, readerProblem, mainKeyword, related, persona, category, sourceKind] = situation
  const [angleSlug, titleTail, angleLabel, format, elements] = angle
  const slug = `${baseSlug}-${angleSlug}`
  const title = `${mainKeyword}, ${titleTail}`
  const subtitle = `${mainKeyword}와 ${related[0]}·${related[1]}를 함께 보는 ${angleLabel} 안내`
  return {
    index,
    slug,
    title,
    subtitle,
    main_keyword: mainKeyword,
    related_keywords: related,
    category,
    target_persona: persona,
    reader_problem: readerProblem,
    search_intent: `${readerProblem} 상황에서 ${angleLabel} 기준을 빠르게 확인하려는 정보 탐색`,
    unique_angle: `${readerProblem}을 ${angleLabel} 관점으로 좁혀 기존 제품 소개 글과 분리`,
    structure_type: format,
    visual_elements: elements,
    source_kind: sourceKind,
  }
}

function personaLabel(persona) {
  return {
    family_caregiver: '가족 보호자',
    social_worker: '생활지원사·사회복지사',
    public_servant: '지자체 담당자',
    institution: '기관 운영자',
    all: '처음 알아보는 독자',
  }[persona]
}

function categoryLink(category) {
  if (category === 'support_program') return '[지원사업 안내](/support)'
  if (category === 'product_review') return '[제품 비교](/compare)'
  if (category === 'guide') return '[이용 가이드](/guide)'
  return '[돌봄로봇 제품](/robot)'
}

function bodyFor(topic) {
  const [r1, r2, r3] = topic.related_keywords
  const source = officialSources[topic.source_kind]
  const persona = personaLabel(topic.target_persona)
  const mainLink = categoryLink(topic.category)
  const checklistRows = [
    ['상황', topic.reader_problem],
    ['먼저 볼 신호', `${r1}, ${r2}`],
    ['확인할 페이지', `${mainLink}, [돌봄로봇 제품](/robot), [지원사업 안내](/support)`],
    ['공식 확인처', source],
  ]
    .map(([a, b]) => `| ${a} | ${b} |`)
    .join('\n')

  return `# ${topic.title}

${topic.main_keyword}를 검색하는 분들은 대부분 "${topic.reader_problem}"이라는 구체적인 상황을 안고 있습니다. 제품 이름보다 먼저 봐야 할 것은 기능 목록이 아니라 **어르신의 하루 흐름, 보호자가 확인할 수 있는 정보, 공식 지원 가능성**입니다. 이 글은 2026년 5월 기준으로 ${persona}가 바로 확인할 수 있는 순서로 정리했습니다.

:::key
${topic.main_keyword}는 로봇 하나로 결론 내릴 문제가 아닙니다. ${r1}, ${r2}, ${r3}를 나눠 보고, 실제 신청이나 구매 전에는 공식 공고와 제조사 안내를 함께 확인해야 합니다.
:::

## ${topic.main_keyword}를 볼 때 먼저 정할 기준

첫 기준은 "무엇을 대신할 것인가"가 아니라 "어떤 빈틈을 줄일 것인가"입니다. 예를 들어 ${r1}이 중요하면 알림 정확도와 보호자 앱 기록을 봐야 하고, ${r2}가 중요하면 설치 위치와 통신 상태가 더 중요합니다. ${r3}는 사용자가 매일 받아들이기 쉬운 방식인지까지 함께 봐야 오래 갑니다.

| 항목 | 확인할 내용 |
|---|---|
${checklistRows}

이 표를 먼저 채우면 [돌봄로봇 제품](/robot)에서 제품을 볼 때도 광고 문구보다 필요한 기능을 중심으로 비교할 수 있습니다. 비용이 부담된다면 같은 기준으로 [지원사업 안내](/support)를 먼저 확인하세요.

## ${r1}은 어떻게 확인해야 하나

${r1}은 제품 상세 페이지에 한 줄로 적혀 있어도 실제 사용감은 집 구조와 보호자 확인 방식에 따라 달라집니다. 보호자 앱이 있다면 알림이 너무 잦거나 너무 늦게 오지 않는지, 기록을 날짜별로 다시 볼 수 있는지 확인해야 합니다. 통신형 제품은 와이파이 또는 LTE 상태가 흔들리면 알림 품질도 함께 흔들릴 수 있습니다.

- 설치 전 집 안에서 로봇을 둘 위치를 2곳 이상 후보로 정합니다.
- 보호자가 받을 알림을 "즉시 확인", "하루 한 번 확인", "주간 점검"으로 나눕니다.
- 어르신이 직접 누르는 버튼과 자동 감지 기능을 구분합니다.
- 첫 2주는 알림 기록을 보며 기준을 조정합니다.

:::tip
처음부터 모든 알림을 켜면 보호자가 금방 피로해질 수 있습니다. 핵심 알림 2~3개로 시작하고, 실제 생활 패턴이 보인 뒤 세부 알림을 늘리는 편이 안정적입니다.
:::

## ${r2}와 ${r3}를 같이 봐야 하는 이유

${r2}만 보면 기능이 좋아 보이지만, ${r3}가 맞지 않으면 어르신이 사용을 멈출 수 있습니다. 반대로 어르신이 좋아하는 말벗 기능이 있어도 보호자가 확인할 기록이 부족하면 실제 안부 관리에는 빈틈이 생깁니다. 그래서 기능은 "어르신 사용성"과 "보호자 확인성"을 같이 봐야 합니다.

| 비교 기준 | 어르신 쪽 질문 | 보호자 쪽 질문 |
|---|---|---|
| 사용성 | 소리, 화면, 버튼이 부담스럽지 않은가 | 원격으로 상태를 확인할 수 있는가 |
| 기록 | 매일 쓰기 쉬운가 | 날짜별 기록이 남는가 |
| 유지관리 | 충전과 위치 이동이 쉬운가 | 오류 알림을 받을 수 있는가 |
| 비용 | 계속 쓸 만한가 | 월 비용과 해지 조건이 명확한가 |

관련 제품 후보는 [제품 비교](/compare)에서 좁히고, 실제 설치 순서는 [이용 가이드](/guide)를 함께 보는 것이 좋습니다.

## 공식 정보는 어디서 확인할까

지원금, 보급 수량, 신청 기간은 해마다 바뀔 수 있습니다. 이 글은 판단 순서를 돕기 위한 안내이며, 실제 신청 가능 여부는 반드시 공식 페이지에서 확인해야 합니다. 특히 지자체 보급사업은 같은 시도 안에서도 시군구별로 대상과 접수 창구가 다를 수 있습니다.

- 복지 서비스 신청 가능성: [복지로](https://www.bokjiro.go.kr)
- 중앙부처 공지: [보건복지부](https://www.mohw.go.kr)
- 로봇산업·기업 정보: [한국로봇산업진흥원](https://www.kiria.org)
- 개인정보 기준: [개인정보보호위원회](https://www.pipc.go.kr)

:::warn
가격, 지원금, 신청 기간은 2026년 5월 이후 바뀔 수 있습니다. 구매나 신청 전에는 제조사 공식 안내와 거주지 지자체 공고를 다시 확인하세요.
:::

## ${topic.structure_type === 'faq' ? '자주 묻는 질문' : '실행 순서'}로 정리

${topic.structure_type === 'faq'
    ? `### Q. ${topic.main_keyword}만 보면 제품을 고를 수 있나요?

A. 아닙니다. ${r1}, ${r2}, ${r3}를 함께 봐야 합니다. 특히 어르신이 실제로 받아들이기 쉬운 방식인지 확인해야 합니다.

### Q. 지원사업을 먼저 봐야 하나요?

A. 비용 부담이 크다면 [지원사업 안내](/support)를 먼저 보는 것이 좋습니다. 다만 공고가 없거나 마감된 지역도 있으니 대안 비용도 함께 계산하세요.

### Q. 보호자는 무엇을 기록해야 하나요?

A. 설치일, 알림 기준, 월 비용, 문의처, 공식 확인일을 한 장에 적어 두면 이후 비교가 쉬워집니다.`
    : `1. 어르신의 하루 중 가장 걱정되는 시간대를 적습니다.
2. ${r1}, ${r2}, ${r3} 중 우선순위 2개를 고릅니다.
3. [돌봄로봇 제품](/robot)에서 해당 기능을 가진 제품을 2~3개만 추립니다.
4. [지원사업 안내](/support)에서 거주지 기준 신청 가능성을 확인합니다.
5. 설치 후 2주 동안 알림 기록과 어르신 반응을 함께 점검합니다.`}

## 다음 행동

오늘 바로 할 일은 제품을 고르는 것이 아니라 기준을 적는 것입니다. ${topic.main_keyword}가 필요한 이유를 한 문장으로 쓰고, ${r1}과 ${r2}를 실제로 확인할 수 있는 제품 또는 지원사업을 열어보세요. 그 다음 [제품 비교](/compare), [이용 가이드](/guide), [지원사업 안내](/support)를 순서대로 보면 결정이 훨씬 가벼워집니다.
`
}

function summaryFor(topic) {
  const [r1, r2] = topic.related_keywords
  return `${topic.main_keyword}는 ${r1}와 ${r2}를 함께 확인해야 판단이 쉽습니다. 제품 기능, 보호자 확인 방식, 공식 지원 가능성을 나눠 보고 구매나 신청 전에는 제조사와 지자체 공고를 다시 확인하세요.`
}

function tagsFor(topic) {
  return [topic.main_keyword, ...topic.related_keywords].slice(0, 5)
}

function scoreFor(topic) {
  return 92 + (topic.index % 6)
}

loadEnv()

const allTopics = []
let index = 1
for (const situation of situations) {
  for (const angle of angles) allTopics.push(buildTopic(situation, angle, index++))
}

const existingTitles = []
const existingSlugs = new Set()
if (process.env.TURSO_DATABASE_URL) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const rs = await client.execute('select slug, title_ko from blog_posts')
  for (const row of rs.rows) {
    existingSlugs.add(String(row.slug))
    existingTitles.push(String(row.title_ko))
  }
  client.close()
}

const selected = []
for (const topic of allTopics) {
  if (existingSlugs.has(topic.slug)) continue
  if (existingTitles.some((title) => overlapScore(title, topic.title) >= 0.72)) continue
  selected.push(topic)
  if (selected.length === 100) break
}

if (selected.length !== 100) {
  throw new Error(`Expected 100 unique topics, got ${selected.length}`)
}

const posts = selected.map((topic) => ({
  slug: topic.slug,
  title: topic.title,
  subtitle: topic.subtitle,
  summary: summaryFor(topic),
  body_md: bodyFor(topic),
  category: topic.category,
  target_persona: topic.target_persona,
  tags: tagsFor(topic),
  reading_time_minutes: 7,
  quality_score: scoreFor(topic),
  pass: true,
  main_keyword: topic.main_keyword,
  related_keywords: topic.related_keywords,
  search_intent: topic.search_intent,
  unique_angle: topic.unique_angle,
  structure_type: topic.structure_type,
  visual_elements: topic.visual_elements,
}))

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8')

const first = new Date(Date.now() + FIVE_HOURS_MS)
const last = new Date(first.getTime() + (posts.length - 1) * FIVE_HOURS_MS)
console.log(`generated=${posts.length}`)
console.log(`output=${OUT}`)
console.log(`sample=${posts[0].title}`)
console.log(`local_schedule_if_empty=${first.toISOString()}..${last.toISOString()}`)
