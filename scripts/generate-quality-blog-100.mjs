import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch.json')
const MANIFEST = path.join(ROOT, 'scripts', 'blog-generated-2026-quality-batch.manifest.json')

const situations = [
  ['senior-center-first-class', '경로당 돌봄로봇 첫 수업', ['경로당 프로그램', '어르신 참여도', '진행자 멘트'], 'institution', 'guide', '진행자가 낯선 로봇을 소개해야 하는 첫 시간'],
  ['public-rental-alone-parent', '공공임대 독거노인 돌봄로봇', ['관리사무소 협조', '방문 확인', '응급 알림'], 'social_worker', 'support_program', '공공임대 단지에서 혼자 지내는 어르신을 살피는 상황'],
  ['island-village-care-robot', '도서지역 돌봄로봇 연결', ['LTE 라우터', '방문 점검', '지자체 지원'], 'public_servant', 'support_program', '섬이나 해안 마을처럼 방문 간격이 긴 지역'],
  ['apartment-management-alert', '아파트 돌봄로봇 안부 알림', ['관리사무소', '보호자 연락', '개인정보 동의'], 'family_caregiver', 'care_info', '관리사무소와 가족이 함께 안부 체계를 맞추는 상황'],
  ['caregiver-app-notification', '보호자 앱 돌봄로봇 알림', ['알림 피로', '긴급도 구분', '기록 확인'], 'family_caregiver', 'guide', '자녀가 하루에도 여러 번 알림을 받는 상황'],
  ['voice-volume-hearing', '난청 어르신 돌봄로봇 음량', ['큰 글씨', '반복 안내', '시각 알림'], 'family_caregiver', 'care_info', '소리를 잘 못 듣는 어르신에게 안내가 전달되지 않는 상황'],
  ['bathroom-safety-flow', '욕실 앞 돌봄로봇 안전 동선', ['미끄럼 위험', '센서 위치', '야간 조명'], 'family_caregiver', 'guide', '밤에 화장실을 자주 오가는 어르신의 동선'],
  ['meal-skip-alert', '식사 거름 알림 돌봄로봇', ['식사 시간', '냉장고 사용', '보호자 확인'], 'family_caregiver', 'care_info', '식사 시간이 불규칙해진 부모님을 확인하는 상황'],
  ['aircon-heatwave-alert', '폭염 돌봄로봇 안부 확인', ['실내 온도', '수분 안내', '지자체 돌봄'], 'public_servant', 'care_info', '여름철 폭염 기간 독거 어르신 안전 확인'],
  ['winter-cold-alert', '한파 돌봄로봇 실내 점검', ['난방 확인', '전기장판', '방문 연계'], 'social_worker', 'care_info', '겨울철 한파주의보 때 연락이 어려운 가정'],
  ['pharmacy-routine-reminder', '약국 연계 복약 알림 로봇', ['복약 시간표', '처방 변경', '가족 공유'], 'family_caregiver', 'guide', '약 봉투가 바뀔 때마다 알림을 다시 맞춰야 하는 상황'],
  ['hospital-follow-up-call', '외래 일정 돌봄로봇 알림', ['진료 예약', '이동 준비', '보호자 공유'], 'family_caregiver', 'guide', '외래 방문일을 자주 잊는 부모님을 돕는 상황'],
  ['welfare-case-note', '사례관리 돌봄로봇 기록', ['방문 메모', '동의 범위', '성과 점검'], 'social_worker', 'support_program', '생활지원사가 방문 기록과 로봇 기록을 함께 보는 상황'],
  ['senior-job-program-robot', '노인일자리 돌봄로봇 활용', ['참여자 교육', '안부 확인', '역할 분담'], 'public_servant', 'support_program', '노인일자리 참여자가 안부 확인을 보조하는 상황'],
  ['community-nurse-dashboard', '방문간호 돌봄로봇 대시보드', ['생활 변화', '위험 신호', '공유 기준'], 'social_worker', 'care_info', '방문간호와 생활돌봄 기록이 따로 흩어진 상황'],
  ['family-group-consent', '가족 단체방 돌봄로봇 공유', ['권한 설정', '대표 보호자', '알림 기준'], 'family_caregiver', 'guide', '형제자매가 함께 부모님 돌봄 정보를 확인하는 상황'],
  ['camera-off-privacy', '카메라 없는 돌봄로봇 선택', ['사생활 보호', '음성 인식', '센서 대안'], 'family_caregiver', 'product_review', '카메라 기능을 부담스러워하는 어르신의 선택'],
  ['subscription-contract-end', '돌봄로봇 약정 종료 점검', ['반납 조건', '데이터 삭제', '재계약'], 'family_caregiver', 'product_review', '렌탈 약정이 끝나기 전 선택을 해야 하는 상황'],
  ['device-transfer-elderly-couple', '부부가 쓰는 돌봄로봇 계정', ['공동 사용', '알림 분리', '대표 사용자'], 'family_caregiver', 'guide', '노부부가 한 기기를 함께 사용하는 가정'],
  ['care-home-night-shift', '요양시설 야간 돌봄로봇 운영', ['야간 순회', '기록 인계', '소음 기준'], 'institution', 'guide', '요양시설 야간 근무자가 로봇 알림을 함께 보는 상황'],
  ['senior-center-budget-report', '복지관 돌봄로봇 성과 보고', ['참여율', '만족도', '예산 설명'], 'institution', 'support_program', '복지관이 다음 예산을 설명해야 하는 상황'],
  ['local-council-briefing', '지자체 돌봄로봇 의회 설명', ['사업 목적', '선정 기준', '성과 지표'], 'public_servant', 'support_program', '담당자가 의회나 주민 설명 자료를 준비하는 상황'],
  ['rural-network-failover', '농촌 돌봄로봇 통신 장애', ['와이파이 음영', 'LTE 백업', '방문 일정'], 'family_caregiver', 'guide', '농촌 주택에서 통신이 끊겼다 이어지는 상황'],
  ['senior-refuses-camera', '어르신 카메라 거부 돌봄로봇', ['설명 순서', '동의 철회', '대체 기능'], 'family_caregiver', 'care_info', '부모님이 감시받는 느낌 때문에 거부하는 상황'],
  ['after-funeral-reuse', '돌봄로봇 반납과 재사용 준비', ['계정 해제', '기록 삭제', '기기 점검'], 'family_caregiver', 'guide', '사용 종료 후 기기와 기록을 정리해야 하는 상황'],
]

const angles = [
  ['decision', '선택 기준', '비교표와 판단 기준으로 보는 안내', 'comparison', ['summary_box', 'table', 'pros_cons', 'source_box']],
  ['checklist', '점검 체크리스트', '실행 전 확인 항목을 정리한 안내', 'checklist', ['summary_box', 'checklist', 'warning_box', 'cta']],
  ['workflow', '운영 순서', '현장에서 바로 따라가는 단계별 안내', 'how_to', ['steps', 'table', 'tip_box', 'cta']],
  ['faq', '자주 묻는 질문', '보호자와 담당자가 헷갈리는 질문 답변', 'faq', ['faq', 'source_box', 'checklist', 'cta']],
]

const formatLabel = {
  comparison: '비교형',
  checklist: '체크리스트형',
  how_to: '절차형',
  faq: 'FAQ형',
}

const sources = [
  ['보건복지부', 'https://www.mohw.go.kr'],
  ['복지로', 'https://www.bokjiro.go.kr'],
  ['한국로봇산업진흥원', 'https://www.kiria.org'],
  ['개인정보보호위원회', 'https://www.pipc.go.kr'],
]

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function pickSource(category, idx) {
  if (idx === 0) return sources[0]
  if (category === 'support_program') return sources[idx % 2]
  if (category === 'product_review') return sources[2]
  if (idx % 9 === 0) return sources[3]
  return sources[idx % sources.length]
}

function topicSource(topic, idx) {
  if (/개인정보|카메라|동의|계정|공유|기록 삭제|반납/.test(topic.mainKeyword)) return sources[3]
  return pickSource(topic.category, idx)
}

function withParticle(word, pair = '과/와') {
  const code = word.charCodeAt(word.length - 1)
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  if (pair === '이/가') return `${word}${hasBatchim ? '이' : '가'}`
  if (pair === '을/를') return `${word}${hasBatchim ? '을' : '를'}`
  return `${word}${hasBatchim ? '과' : '와'}`
}

function titleFor(main, angleTail, idx) {
  const openers = [
    `${main}, ${angleTail}부터 정리하기`,
    `${main} ${angleTail}, 보호자가 먼저 볼 것`,
    `${main} ${angleTail}, 현장 기준으로 보는 법`,
    `${main} ${angleTail}, 신청 전 확인할 것`,
  ]
  return openers[idx % openers.length]
}

function subtitleFor(main, related, angleTail, format, idx) {
  const [a, b] = related
  const endings = [
    `${withParticle(main)} ${a}, ${b}를 함께 보는 ${formatLabel[format]} 가이드`,
    `${main} 기준에 ${a}, ${b}까지 넣어 판단하는 ${angleTail} 안내`,
    `${withParticle(main, '을/를')} 준비할 때 ${a}, ${b}를 빠뜨리지 않는 실무형 정리`,
  ]
  return endings[idx % endings.length]
}

function summaryFor(main, related, situation, format) {
  const [a, b] = related
  return `${situation}에서 ${withParticle(main, '을/를')} 검토할 때는 ${withParticle(a)} ${b}를 함께 봐야 합니다. 이 글은 ${formatLabel[format]} 구조로 보호자와 담당자가 바로 확인할 기준을 정리합니다.`
}

function intro(topic, sourceName) {
  return `${topic.situation}에는 제품 이름보다 먼저 확인할 것이 있습니다. ${withParticle(topic.mainKeyword, '이/가')} 실제로 도움이 되려면 ${topic.related[0]}, ${topic.related[1]}, ${withParticle(topic.related[2], '이/가')} 한 흐름으로 이어져야 합니다. 이 글은 2026년 기준으로 보호자, 생활지원사, 기관 담당자가 회의나 신청 전에 바로 대조할 수 있도록 정리했습니다. 세부 지원 여부와 접수 기간은 지역마다 달라질 수 있으므로 마지막 판단은 ${sourceName} 또는 거주지 지자체 공고에서 다시 확인하는 방식이 안전합니다.`
}

function table(topic) {
  return `| 확인 항목 | 좋은 상태 | 다시 점검할 상태 |
|---|---|---|
| ${topic.related[0]} | 가족이나 담당자가 같은 기준으로 확인한다 | 사람마다 확인 기준이 다르다 |
| ${topic.related[1]} | 알림과 기록이 실제 행동으로 이어진다 | 알림은 오지만 누가 볼지 정해져 있지 않다 |
| ${topic.related[2]} | 비용, 동의, 운영 책임이 문서로 남아 있다 | 구두 설명만 듣고 결정한다 |`
}

function checklist(topic) {
  return `- [ ] ${topic.mainKeyword}을 쓰는 목적을 한 문장으로 적었다
- [ ] ${topic.related[0]} 담당자를 정했다
- [ ] ${topic.related[1]} 기준을 가족 또는 기관 내부에서 공유했다
- [ ] ${topic.related[2]} 관련 안내문이나 계약 조건을 확인했다
- [ ] 설치 후 2주 동안 조정할 항목을 미리 적어 두었다`
}

function faq(topic) {
  return `### Q. ${topic.mainKeyword}은 제품만 고르면 끝인가요?

A. 아닙니다. ${topic.related[0]}와 ${topic.related[1]}를 누가 확인할지 정해야 실제 운영이 됩니다. 제품 기능은 시작점이고, 연락 순서와 기록 확인 방식이 같이 정리되어야 합니다.

### Q. 어르신이 부담스러워하면 어떻게 하나요?

A. 첫날부터 모든 기능을 켜기보다 필요한 기능 1~2개만 설명하는 편이 좋습니다. 특히 카메라, 음성, 위치, 가족 공유 기능은 동의 범위를 먼저 설명하고 언제든 조정할 수 있다고 알려야 합니다.

### Q. 지원사업과 같이 볼 수 있나요?

A. 가능합니다. 다만 지원 대상, 자부담, 접수 기간은 지역별로 다르므로 [지원사업 안내](/support)와 거주지 행정복지센터 공고를 함께 확인해야 합니다.`
}

function steps(topic) {
  return `1. ${topic.mainKeyword}이 필요한 이유를 가족 또는 담당자와 함께 적습니다.
2. ${topic.related[0]}와 ${topic.related[1]} 중 먼저 해결할 항목을 고릅니다.
3. [돌봄로봇 제품](/robot)에서 필요한 기능이 있는 제품만 추립니다.
4. [제품 비교](/compare)에서 비용, 유지관리, 알림 방식을 비교합니다.
5. 설치 후 2주 동안 기록을 보고 알림 강도와 공유 범위를 조정합니다.`
}

function bodyFor(topic, idx) {
  const [sourceName, sourceUrl] = topicSource(topic, idx)
  const accent = idx % 2 === 0 ? 'key' : 'tip'
  const secondary = idx % 3 === 0 ? 'warn' : 'tip'
  const localLink = topic.category === 'support_program' ? '[지원사업 안내](/support)' : topic.category === 'product_review' ? '[제품 비교](/compare)' : '[처음 쓰는 가이드](/guide)'
  const sourceLine = `[${sourceName}](${sourceUrl})`

  const middle =
    topic.format === 'comparison'
      ? `## ${topic.mainKeyword} 판단 기준, ${topic.related[0]}와 ${topic.related[1]}를 나눠 보기\n\n${table(topic)}\n\n비교표를 볼 때는 점수가 높은 제품을 찾기보다 우리 상황에서 실패 가능성이 큰 항목을 먼저 찾는 편이 현실적입니다. 예를 들어 ${topic.related[0]}가 약하면 보호자가 계속 확인 전화를 하게 되고, ${topic.related[1]}가 약하면 알림이 쌓여도 실제 조치가 늦어질 수 있습니다.`
      : topic.format === 'checklist'
        ? `## ${topic.mainKeyword} 체크리스트, 결정 전에 표시할 항목\n\n${checklist(topic)}\n\n체크가 비어 있는 항목은 제품 문제가 아니라 운영 준비 문제일 수 있습니다. 이 상태에서 바로 구매하거나 신청하면 설치 후 조정에 시간이 더 걸립니다.`
        : topic.format === 'faq'
          ? `## ${topic.mainKeyword} FAQ, 보호자가 자주 헷갈리는 부분\n\n${faq(topic)}`
          : `## ${topic.mainKeyword} 운영 순서, 처음 2주를 기준으로 잡기\n\n${steps(topic)}\n\n처음부터 완벽한 운영표를 만들 필요는 없습니다. 첫 2주는 어르신 반응, 보호자 확인 빈도, 담당자의 기록 부담을 보는 기간으로 두는 것이 좋습니다.`

  return `# ${topic.title}

${intro(topic, sourceName)}

:::${accent}
${topic.mainKeyword}의 핵심은 기능을 많이 켜는 것이 아니라 ${topic.related[0]}와 ${topic.related[1]}가 실제 확인 행동으로 이어지게 만드는 것입니다.
:::

## ${topic.mainKeyword}을 먼저 검토해야 하는 이유

${topic.situation}에는 작은 불편이 반복되다가 가족이나 담당자의 부담으로 커지는 일이 많습니다. 돌봄로봇은 이 부담을 모두 대신하는 장치가 아니라, 확인해야 할 신호를 더 일찍 알아차리게 돕는 도구에 가깝습니다. 그래서 ${topic.related[2]}까지 포함해 운영 기준을 정해야 합니다.

${middle}

## ${topic.related[2]}까지 같이 봐야 하는 이유

${topic.related[2]}는 글의 부가 항목처럼 보이지만 실제 운영에서는 나중에 문제가 되는 경우가 많습니다. 비용, 동의, 담당자, 알림 기준이 모호하면 제품은 설치되어 있어도 가족이 다시 수기로 확인하게 됩니다. 특히 여러 가족이 함께 보는 경우에는 대표 보호자, 알림을 받을 시간대, 긴급 상황의 연락 순서를 미리 정해야 합니다.

:::${secondary}
지원금, 접수 기간, 제품 구성은 바뀔 수 있습니다. 신청이나 계약 전에는 ${sourceLine}와 제조사 안내, 거주지 지자체 공고를 함께 확인하세요.
:::

## 실제 적용 전에 비교할 내부 링크

${topic.mainKeyword}을 결정하기 전에 ${localLink}를 먼저 보고, 기능 후보는 [돌봄로봇 제품](/robot)에서 좁히는 흐름이 좋습니다. 비용이나 렌탈 조건이 궁금하다면 [제품 비교](/compare)를 함께 열어 두면 판단이 빨라집니다.

${table(topic)}

## 다음 행동

오늘 바로 할 일은 제품을 고르는 것이 아니라 기준을 적는 것입니다. ${topic.mainKeyword}이 필요한 이유, ${topic.related[0]} 확인자, ${topic.related[1]} 기준을 한 줄씩 적어 두고 가족 또는 담당자와 공유하세요. 그 다음 ${localLink}와 [지원사업 안내](/support)를 확인하면 신청 가능성, 자부담, 설치 준비를 같은 흐름에서 볼 수 있습니다.
`
}

function scorePost(post) {
  let score = 100
  if (!post.title.includes(post.main_keyword)) score -= 20
  if (!post.subtitle.includes(post.main_keyword)) score -= 15
  for (const kw of post.related_keywords.slice(0, 2)) {
    if (!post.title.includes(kw) && !post.subtitle.includes(kw)) score -= 5
  }
  const body = post.body_md
  const internalLinks = (body.match(/\]\(\/(robot|support|compare|guide|blog)/g) || []).length
  const outlinks = (body.match(/\]\(https:\/\//g) || []).length
  if (internalLinks < 2) score -= 10
  if (outlinks < 1) score -= 10
  if (!body.includes(':::key') && !body.includes(':::tip')) score -= 5
  if (!body.includes('|---|')) score -= 5
  if (body.length < 1800) score -= 8
  return Math.max(0, score)
}

const posts = []
let index = 0
for (const situation of situations) {
  for (const angle of angles) {
    const [baseSlug, mainKeyword, related, persona, category, situationText] = situation
    const [angleSlug, angleTail, angleDescription, format, elements] = angle
    const slug = slugify(`${baseSlug}-${angleSlug}`)
    const title = titleFor(mainKeyword, angleTail, index)
    const subtitle = subtitleFor(mainKeyword, related, angleTail, format, index)
    const topic = {
      slug,
      title,
      subtitle,
      mainKeyword,
      related,
      targetPersona: persona,
      category,
      situation: situationText,
      format,
    }
    const body = bodyFor(topic, index)
    const post = {
      slug,
      title,
      subtitle,
      summary: summaryFor(mainKeyword, related, situationText, format),
      body_md: body,
      category,
      target_persona: persona,
      tags: [mainKeyword, ...related, angleTail].slice(0, 5),
      reading_time_minutes: Math.max(5, Math.round(body.length / 650)),
      main_keyword: mainKeyword,
      related_keywords: related,
      expanded_keywords: related,
      search_intent: `${situationText}에서 ${mainKeyword}의 ${angleTail}을 확인하려는 정보 탐색`,
      unique_angle: angleDescription,
      recommended_format: format,
      supporting_elements: elements,
      visual_elements: elements,
      quality_score: 0,
      pass: true,
    }
    post.quality_score = scorePost(post)
    post.pass = post.quality_score >= 90
    posts.push(post)
    index++
  }
}

const titles = new Set()
const slugs = new Set()
const duplicate = posts.find((post) => titles.has(post.title) || slugs.has(post.slug) || !titles.add(post.title) || !slugs.add(post.slug))
if (duplicate) throw new Error(`Duplicate generated: ${duplicate.slug}`)
if (posts.length !== 100) throw new Error(`Expected 100 posts, got ${posts.length}`)
const failed = posts.filter((post) => !post.pass)
if (failed.length > 0) throw new Error(`Quality gate failed: ${failed.map((p) => `${p.slug}:${p.quality_score}`).join(', ')}`)

const manifest = {
  run_id: `quality-100-${new Date().toISOString()}`,
  topic: '돌봄로봇 SEO/GEO/AEO 검색공백 균형 배치',
  target_count: 100,
  generated_count: posts.length,
  target_met: posts.length === 100,
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
    search_intent: post.search_intent,
    unique_angle: post.unique_angle,
    recommended_format: post.recommended_format,
    visual_elements: post.visual_elements,
    quality_score: post.quality_score,
    pass: post.pass,
  })),
}

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8')
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')
console.log(JSON.stringify({ ok: true, out: OUT, manifest: MANIFEST, count: posts.length, minQuality: manifest.min_quality_score, avgQuality: manifest.average_quality_score }, null, 2))
