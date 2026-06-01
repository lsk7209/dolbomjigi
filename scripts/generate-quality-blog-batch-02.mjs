import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch-02.json')
const MANIFEST = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch-02.manifest.json')

const situations = [
  ['family-care-meeting-robot', '가족회의 돌봄로봇 결정', ['역할 분담', '비용 합의', '알림 기준'], 'family_caregiver', 'guide', '형제자매가 부모님 돌봄 방식을 함께 정해야 하는 상황'],
  ['senior-smartphone-low-skill', '스마트폰 서툰 어르신 돌봄로봇', ['음성 안내', '큰 버튼', '보호자 앱'], 'family_caregiver', 'care_info', '스마트폰 조작이 어려운 어르신에게 기기를 맞추는 상황'],
  ['community-health-center-robot', '보건소 돌봄로봇 연계', ['방문 상담', '생활 신호', '지역 자원'], 'social_worker', 'support_program', '보건소와 복지 담당자가 독거 어르신 지원을 연결하는 상황'],
  ['dementia-safe-zone-home', '인지저하 어르신 안심 동선', ['배회 신호', '문열림 알림', '가족 연락'], 'family_caregiver', 'care_info', '집 안팎 이동이 잦아진 부모님을 살피는 상황'],
  ['care-robot-install-day', '돌봄로봇 설치 당일 준비', ['설치 위치', '와이파이 확인', '어르신 설명'], 'family_caregiver', 'guide', '설치 기사 방문 전에 가족이 준비할 것을 정리하는 상황'],
  ['welfare-center-demo-day', '복지관 돌봄로봇 체험회', ['체험 동선', '설문 문항', '상담 연결'], 'institution', 'support_program', '복지관에서 여러 어르신에게 기기를 소개하는 상황'],
  ['rental-price-trap-check', '돌봄로봇 렌탈 비용 함정', ['약정 기간', '위약금', '소모품 비용'], 'family_caregiver', 'product_review', '월 이용료만 보고 렌탈을 결정하려는 상황'],
  ['care-robot-accessibility-home', '장애 동반 어르신 돌봄로봇', ['청각 지원', '시각 안내', '보조기기 연계'], 'family_caregiver', 'care_info', '청각이나 시각 불편이 있는 어르신에게 맞춤 설정이 필요한 상황'],
  ['municipal-pilot-selection', '지자체 돌봄로봇 시범사업 선정', ['선정 기준', '성과 지표', '민원 대응'], 'public_servant', 'support_program', '담당자가 시범사업 대상과 설명 기준을 정해야 하는 상황'],
  ['care-staff-training-manual', '생활지원사 돌봄로봇 교육', ['교육 시간표', '점검 문항', '보호자 안내'], 'social_worker', 'guide', '생활지원사가 여러 가정을 같은 기준으로 점검해야 하는 상황'],
  ['robot-alert-escalation', '돌봄로봇 알림 단계 설정', ['긴급도', '연락 순서', '미응답 처리'], 'family_caregiver', 'guide', '알림이 왔을 때 누가 먼저 움직일지 정해야 하는 상황'],
  ['senior-privacy-first-week', '돌봄로봇 첫 주 개인정보 안내', ['동의서', '녹음 설정', '가족 공유'], 'family_caregiver', 'care_info', '설치 첫 주에 사생활 설명을 충분히 해야 하는 상황'],
  ['care-robot-rural-subsidy', '농촌 돌봄로봇 보조금 확인', ['읍면동 문의', '통신 환경', '방문 설치'], 'family_caregiver', 'support_program', '농촌에 계신 부모님이 지원 대상인지 확인하는 상황'],
  ['facility-group-dashboard', '요양시설 돌봄로봇 대시보드', ['층별 관리', '야간 알림', '기록 인계'], 'institution', 'guide', '요양시설에서 여러 기기를 한 번에 관리하는 상황'],
  ['companion-talk-boundary', '말벗 돌봄로봇 기대치 조정', ['대화 품질', '정서 지원', '가족 통화'], 'family_caregiver', 'care_info', '말벗 기능에 너무 많은 기대를 걸기 쉬운 상황'],
  ['care-robot-used-market-risk', '중고 돌봄로봇 구매 위험', ['계정 초기화', '보증 기간', '통신 개통'], 'family_caregiver', 'product_review', '중고 기기를 저렴하게 사려는 보호자가 확인해야 하는 상황'],
  ['senior-housing-operator-robot', '고령자주택 돌봄로봇 운영', ['입주자 동의', '공용공간', '관리 책임'], 'institution', 'support_program', '고령자주택 운영자가 단지 단위 도입을 검토하는 상황'],
  ['robot-support-documents-2026', '2026 돌봄로봇 신청서류', ['주민등록등본', '소득 기준', '대리 신청'], 'family_caregiver', 'support_program', '신청 전에 어떤 서류를 준비해야 할지 모르는 상황'],
  ['care-robot-emergency-drill', '돌봄로봇 응급상황 모의훈련', ['119 연계', '보호자 호출', '오작동 점검'], 'institution', 'guide', '기관이나 가족이 응급 알림 흐름을 미리 연습하는 상황'],
  ['robot-data-retention-policy', '돌봄로봇 기록 보관 기간', ['보관 기간', '삭제 요청', '열람 권한'], 'family_caregiver', 'care_info', '가족이 로봇 기록을 어디까지 남겨야 할지 고민하는 상황'],
  ['care-robot-before-moving', '이사 전 돌봄로봇 재설정', ['주소 변경', '와이파이 변경', '지원 지역'], 'family_caregiver', 'guide', '부모님 이사로 설치 환경과 지원 지역이 바뀌는 상황'],
  ['senior-center-volunteer-robot', '자원봉사자 돌봄로봇 보조', ['활동 범위', '개인정보 교육', '보고 방식'], 'institution', 'support_program', '자원봉사자가 로봇 사용을 옆에서 돕는 상황'],
  ['care-robot-language-dialect', '사투리 음성인식 돌봄로봇', ['발화 속도', '반복 안내', '명령어 훈련'], 'family_caregiver', 'product_review', '지역 사투리 때문에 음성 명령이 잘 안 되는 상황'],
  ['remote-child-weekend-check', '주말 원거리 자녀 안부 확인', ['주말 루틴', '영상통화', '미응답 기준'], 'family_caregiver', 'guide', '평일에는 바빠 주말에 부모님 상태를 집중 확인하는 상황'],
  ['robot-program-evaluation', '돌봄로봇 사업 평가표', ['만족도', '사용 빈도', '예산 근거'], 'public_servant', 'support_program', '사업 종료 후 다음 예산과 성과를 보고해야 하는 상황'],
]

const angles = [
  ['case', '실제 상황별 판단 기준', '사례형', 'case_based', ['summary_box', 'case_box', 'table', 'cta']],
  ['risk', '놓치기 쉬운 위험 점검', '주의형', 'warning', ['warning_box', 'checklist', 'source_box', 'cta']],
  ['setup', '처음 맞추는 실행 순서', '절차형', 'how_to', ['steps', 'table', 'tip_box', 'cta']],
  ['faq', '보호자가 묻는 핵심 질문', 'FAQ형', 'faq', ['faq', 'checklist', 'source_box', 'cta']],
]

const sources = {
  welfare: ['복지로', 'https://www.bokjiro.go.kr'],
  ministry: ['보건복지부', 'https://www.mohw.go.kr'],
  robot: ['한국로봇산업진흥원', 'https://www.kiria.org'],
  privacy: ['개인정보보호위원회', 'https://www.pipc.go.kr'],
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function particle(word, type = '은') {
  const code = word.charCodeAt(word.length - 1)
  const batchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  if (type === '은') return `${word}${batchim ? '은' : '는'}`
  if (type === '을') return `${word}${batchim ? '을' : '를'}`
  if (type === '과') return `${word}${batchim ? '과' : '와'}`
  return `${word}${batchim ? '이' : '가'}`
}

function sourceFor(category, main) {
  if (/개인정보|동의|기록|계정|녹음|삭제/.test(main)) return sources.privacy
  if (category === 'support_program') return sources.welfare
  if (category === 'product_review') return sources.robot
  return sources.ministry
}

function title(main, related, angleTail, idx) {
  const [a, b] = related
  const forms = [
    `${main}, ${particle(a, '과')} ${b} ${angleTail}`,
    `${main} ${angleTail}, ${a}부터 ${b}까지`,
    `${main} ${angleTail}, ${particle(a, '과')} ${b} 확인`,
    `${main}, ${particle(a, '과')} ${b} 기준`,
  ]
  return forms[idx % forms.length]
}

function subtitle(main, related, format, idx) {
  const [a, b] = related
  const forms = [
    `${particle(main, '과')} ${a}, ${b}를 함께 보는 ${format} 가이드`,
    `${main} 준비 전 ${a}, ${b}를 빠뜨리지 않는 ${format} 안내`,
    `${main} 검색자가 궁금해하는 ${a}, ${b} 기준 정리`,
  ]
  return forms[idx % forms.length]
}

function summary(main, related, situation, format) {
  return `${situation}에서 ${particle(main, '을')} 검토할 때 ${related[0]}, ${related[1]}, ${related[2]}를 함께 판단하도록 돕는 ${format} 글입니다.`
}

function table(topic) {
  const headers = [
    ['판단 항목', '바로 진행해도 되는 신호', '보류하고 확인할 신호'],
    ['확인 기준', '준비된 상태', '추가 확인이 필요한 상태'],
    ['운영 포인트', '안정적인 흐름', '흔들릴 수 있는 흐름'],
  ][topic.index % 3]
  return `| ${headers[0]} | ${headers[1]} | ${headers[2]} |
|---|---|---|
| ${topic.related[0]} | 책임자와 확인 시간이 정해져 있다 | 누가 확인할지 정해지지 않았다 |
| ${topic.related[1]} | 가족 또는 담당자가 같은 기준을 본다 | 알림만 있고 후속 행동이 없다 |
| ${topic.related[2]} | 문서나 안내문으로 남아 있다 | 말로만 설명을 들었다 |`
}

function checklist(topic) {
  return `- [ ] ${particle(topic.main, '을')} 쓰는 목적을 한 문장으로 적었다
- [ ] ${topic.related[0]} 담당자와 확인 시간을 정했다
- [ ] ${topic.related[1]} 기준을 가족 또는 기관 내부에 공유했다
- [ ] ${topic.related[2]} 관련 안내문을 확인했다
- [ ] 설치 후 2주 동안 조정할 항목을 적어 두었다`
}

function faq(topic) {
  return `### Q. ${topic.main}은 제품 기능만 보면 되나요?

A. 아닙니다. ${topic.related[0]}와 ${topic.related[1]}가 실제 행동으로 이어지는지 봐야 합니다. 기능이 있어도 누가 확인할지 정하지 않으면 운영이 흔들립니다.

### Q. 어르신이 부담스러워하면 어떻게 설명하나요?

A. 감시가 아니라 연락과 확인을 돕는 기준이라고 설명해야 합니다. 특히 녹음, 영상, 가족 공유처럼 민감한 기능은 켜는 이유와 끄는 방법을 같이 알려야 합니다.

### Q. 지원사업과 같이 검토해도 되나요?

A. 가능합니다. 다만 접수 기간, 자부담, 대상 조건은 지역마다 다르므로 [지원사업 안내](/support)와 공식 공고를 함께 확인해야 합니다.`
}

function steps(topic) {
  return `1. ${topic.situation}에서 가장 불편한 지점을 하나 고릅니다.
2. ${topic.related[0]}와 ${topic.related[1]} 중 먼저 확인할 기준을 정합니다.
3. [돌봄로봇 제품](/robot)에서 필요한 기능이 있는 모델만 추립니다.
4. [제품 비교](/compare)에서 비용, 알림, 유지관리 조건을 비교합니다.
5. 설치 후 2주 동안 기록을 보고 알림 강도와 공유 범위를 조정합니다.`
}

function body(topic, idx) {
  const [sourceName, sourceUrl] = sourceFor(topic.category, topic.main)
  const accent = idx % 2 === 0 ? 'key' : 'tip'
  const second = idx % 3 === 0 ? 'warn' : 'tip'
  const mainLink = topic.category === 'support_program' ? '[지원사업 안내](/support)' : topic.category === 'product_review' ? '[제품 비교](/compare)' : '[이용 가이드](/guide)'
  const opening = [
    `${topic.situation}에서는 제품명보다 운영 기준이 먼저입니다.`,
    `${topic.situation}이라면 먼저 제품 후보보다 확인 흐름을 정해야 합니다.`,
    `${topic.situation}에는 기능 목록보다 가족과 담당자의 역할 구분이 더 중요합니다.`,
    `${topic.situation}에서는 한 번의 선택보다 설치 뒤 2주 운영 기준이 더 중요합니다.`,
  ][idx % 4]
  const reasonHeading = [
    `${topic.main}을 먼저 따져야 하는 이유`,
    `${topic.main}에서 먼저 정할 기준`,
    `${topic.main} 검토 전 놓치기 쉬운 맥락`,
    `${topic.main}을 제품보다 운영으로 봐야 하는 이유`,
  ][idx % 4]
  const supportHeading = [
    `${topic.related[2]}까지 같이 봐야 하는 이유`,
    `${topic.related[2]}가 뒤늦게 문제가 되는 지점`,
    `${topic.related[2]}를 초기에 정해야 하는 이유`,
  ][idx % 3]
  const actionHeading = [
    '지금 할 일',
    '오늘 정리할 기준',
    '가족이나 담당자와 바로 맞출 항목',
  ][idx % 3]
  const middle = topic.structure === 'faq'
    ? `## ${topic.main} FAQ, 먼저 풀어야 할 질문\n\n${faq(topic)}`
    : topic.structure === 'how_to'
      ? `## ${topic.main} 실행 순서, 첫 2주 기준으로 보기\n\n${steps(topic)}`
      : topic.structure === 'warning'
        ? `## ${topic.main} 위험 점검, 결정 전에 멈춰 볼 지점\n\n${checklist(topic)}\n\n위 항목이 비어 있다면 제품이 부족해서가 아니라 운영 기준이 부족한 상태일 수 있습니다. 이때는 신청이나 계약보다 가족과 담당자의 역할을 먼저 정하는 편이 낫습니다.`
        : `## ${topic.main} 사례별 판단, 우리 집에 맞는 기준\n\n${table(topic)}\n\n사례형으로 볼 때 중요한 점은 좋은 기능을 많이 찾는 것이 아니라 실패 가능성이 큰 지점을 먼저 줄이는 것입니다. ${topic.related[0]}가 불분명하면 확인이 늦고, ${topic.related[1]}가 흐리면 알림이 와도 행동으로 이어지지 않습니다.`

  return `# ${topic.title}

${opening} ${particle(topic.main, '이')} 실제 도움이 되려면 ${topic.related[0]}, ${topic.related[1]}, ${particle(topic.related[2], '이')} 같은 방향으로 연결되어야 합니다. 이 글은 2026년 기준으로 보호자, 생활지원사, 기관 담당자가 바로 확인할 수 있게 정리했습니다.

:::${accent}
${topic.main}의 핵심은 기능을 많이 켜는 것이 아니라 ${topic.related[0]}와 ${topic.related[1]}를 실제 확인 행동으로 연결하는 것입니다.
:::

## ${reasonHeading}

${topic.situation}에서는 작은 불편이 반복되다가 돌봄 부담으로 커질 수 있습니다. 돌봄로봇은 가족이나 담당자를 대신하는 장치가 아니라 확인해야 할 신호를 놓치지 않게 돕는 도구입니다. 그래서 ${topic.related[2]}까지 포함해 기준을 세워야 합니다.

${middle}

## ${supportHeading}

${topic.related[2]}는 나중에 확인해도 될 부가 항목처럼 보이지만 실제 운영에서는 갈등의 원인이 되기 쉽습니다. 비용, 권한, 기록, 연락 순서가 모호하면 기기가 설치되어 있어도 가족이 다시 전화와 메모로 확인하게 됩니다.

:::${second}
지원금, 제품 구성, 개인정보 설정은 바뀔 수 있습니다. 신청이나 계약 전에는 [${sourceName}](${sourceUrl})와 제조사 안내, 거주지 지자체 공고를 함께 확인하세요.
:::

## 관련 페이지에서 이어서 확인하기

${mainLink}를 먼저 열어 기준을 잡고, 기능 후보는 [돌봄로봇 제품](/robot)에서 좁히는 흐름이 좋습니다. 비용과 유지 조건이 궁금하다면 [제품 비교](/compare)를 함께 보면 판단이 빨라집니다.

${table(topic)}

## ${actionHeading}

오늘 바로 할 일은 구매가 아니라 기준 정리입니다. ${topic.main}이 필요한 이유, ${topic.related[0]} 확인자, ${topic.related[1]} 판단 기준을 한 줄씩 적어 두세요. 그 다음 ${mainLink}와 [지원사업 안내](/support)를 확인하면 신청 가능성, 자부담, 설치 준비를 같은 흐름에서 볼 수 있습니다.
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
  if (internalLinks < 2) value -= 10
  if (outlinks < 1) value -= 10
  if (!post.body_md.includes(':::key') && !post.body_md.includes(':::tip')) value -= 5
  if (!post.body_md.includes('|---|')) value -= 5
  if (post.body_md.length < 1800) value -= 8
  return Math.max(0, value)
}

const posts = []
let idx = 0
for (const [baseSlug, main, related, persona, category, situation] of situations) {
  for (const [angleSlug, angleTail, formatLabel, structure, elements] of angles) {
    const topic = {
      slug: slugify(`${baseSlug}-${angleSlug}`),
      main,
      related,
      category,
      persona,
      situation,
      structure,
      index: idx,
      title: title(main, related, angleTail, idx),
    }
    const post = {
      slug: topic.slug,
      title: topic.title,
      subtitle: subtitle(main, related, formatLabel, idx),
      summary: summary(main, related, situation, formatLabel),
      body_md: body(topic, idx),
      category,
      target_persona: persona,
      tags: [main, ...related, angleTail].slice(0, 5),
      reading_time_minutes: 6,
      main_keyword: main,
      related_keywords: related,
      expanded_keywords: related,
      search_intent: `${situation}에서 ${main}의 ${angleTail}을 확인하려는 정보 탐색`,
      unique_angle: formatLabel,
      recommended_format: structure,
      supporting_elements: elements,
      visual_elements: elements,
      accent_colors: idx % 3 === 0 ? ['indigo', 'amber'] : idx % 3 === 1 ? ['amber'] : ['indigo'],
      quality_score: 0,
      pass: true,
    }
    post.quality_score = score(post)
    post.pass = post.quality_score >= 90
    posts.push(post)
    idx++
  }
}

const titles = new Set()
const slugs = new Set()
for (const post of posts) {
  if (titles.has(post.title) || slugs.has(post.slug)) throw new Error(`duplicate generated: ${post.slug}`)
  titles.add(post.title)
  slugs.add(post.slug)
}
if (posts.length !== 100) throw new Error(`expected 100 posts, got ${posts.length}`)
const failed = posts.filter((post) => !post.pass)
if (failed.length > 0) throw new Error(`quality failed: ${failed.map((post) => `${post.slug}:${post.quality_score}`).join(', ')}`)

const manifest = {
  run_id: `quality-100-batch-02-${new Date().toISOString()}`,
  topic: '돌봄로봇 추가 SEO/GEO/AEO 검색공백 균형 배치',
  target_count: 100,
  generated_count: posts.length,
  target_met: true,
  handoff_ready: true,
  min_quality_score: Math.min(...posts.map((post) => post.quality_score)),
  average_quality_score: Math.round(posts.reduce((sum, post) => sum + post.quality_score, 0) / posts.length),
  title_export_source: OUT,
  persona_source: 'inferred:dolbomjigi',
  duplicate_status: 'new-local-dedup-pass',
  review_items: [],
  failed_items: [],
  posts: posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle,
    main_keyword: post.main_keyword,
    expanded_keywords: post.expanded_keywords,
    recommended_format: post.recommended_format,
    visual_elements: post.visual_elements,
    quality_score: post.quality_score,
    pass: post.pass,
  })),
}

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8')
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, out: OUT, manifest: MANIFEST, count: posts.length, minQuality: manifest.min_quality_score, avgQuality: manifest.average_quality_score }, null, 2))
