import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const seedPath = path.join(root, 'src', 'db', 'seed', 'blog_posts.ts');
const manifestPath = path.join(root, 'output', 'dolbomjigi', 'new-content', 'manifest.json');
const topicMapPath = path.join(root, 'output', 'dolbomjigi', 'new-content', 'topic-map.json');

const batch3Slugs = [
  'rural-solo-elderly-winter-freeze-robot',
  'stroke-rehab-companion-robot-routine',
  'dementia-repetitive-questioning-robot-calm',
  'care-robot-fall-detection-radar-blindspot',
  'nursing-home-visit-care-robot-video-call'
];

// 1. Update src/db/seed/blog_posts.ts
let seedContent = fs.readFileSync(seedPath, 'utf8');
const newSeedEntries = [];

for (const slug of batch3Slugs) {
  if (seedContent.includes(`slug: '${slug}'`) || seedContent.includes(`slug: "${slug}"`)) {
    console.log(`Slug already in seed: ${slug}`);
    continue;
  }
  const dir = path.join(root, 'output', 'dolbomjigi', 'new-content', slug);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));
  const bodyMd = fs.readFileSync(path.join(dir, 'article.md'), 'utf8');
  const readingTime = Math.max(5, Math.ceil(bodyMd.length / 700));

  const postObjCode = `  {
    slug: ${JSON.stringify(meta.slug)},
    title_ko: ${JSON.stringify(meta.title_ko)},
    subtitle: ${JSON.stringify(meta.subtitle)},
    summary: ${JSON.stringify(meta.summary)},
    cover_image_url: ${JSON.stringify(meta.cover_image_url)},
    body_md: ${JSON.stringify(bodyMd)},
    category: 'guide',
    target_persona: 'family_caregiver',
    tags_json: ${JSON.stringify(JSON.stringify([meta.main_keyword]))},
    reading_time_minutes: ${readingTime},
    author_id: 1,
    published_at: new Date("2026-10-23T00:00:00.000Z"),
  },`;
  newSeedEntries.push(postObjCode);
}

if (newSeedEntries.length > 0) {
  const lastBracketIndex = seedContent.lastIndexOf(']');
  if (lastBracketIndex !== -1) {
    seedContent = seedContent.slice(0, lastBracketIndex) + newSeedEntries.join('\n') + '\n]\n';
    fs.writeFileSync(seedPath, seedContent, 'utf8');
    console.log(`✅ Appended ${newSeedEntries.length} posts to blog_posts.ts.`);
  }
}

// 2. Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const existingSlugs = new Set(manifest.items.map(x => x.slug));

for (let i = 0; i < batch3Slugs.length; i++) {
  const slug = batch3Slugs[i];
  if (!existingSlugs.has(slug)) {
    const dir = path.join(root, 'output', 'dolbomjigi', 'new-content', slug);
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));
    const qa = JSON.parse(fs.readFileSync(path.join(dir, 'qa.json'), 'utf8'));

    manifest.items.push({
      title: meta.title_ko,
      slug: meta.slug,
      input_id: `topic-${String(manifest.items.length + 1).padStart(2, '0')}`,
      output_path: `output/dolbomjigi/new-content/${meta.slug}`,
      status: 'published',
      qa_score: qa.total_score,
      character_count: qa.character_count,
      reason: '발행 승인 및 blog_posts 시드 적재 완료'
    });
  }
}

manifest.completed_count = manifest.items.length;
manifest.updated_at = new Date().toISOString();

// Batch 4 Queue for next daily run
manifest.next_queue = [
  {
    slug: "care-robot-battery-charging-safety-tips",
    title: "돌봄로봇 배터리 과열과 폭발 걱정 없이 24시간 안전하게 충전하는 법",
    main_keyword: "돌봄로봇 배터리 충전",
    target_persona: "family_caregiver"
  },
  {
    slug: "smart-village-rural-elderly-care-project",
    title: "지자체 스마트 돌봄 마을 사업: 우리 동네 어르신 무료 반려로봇 보급 기준",
    main_keyword: "스마트 돌봄마을 반려로봇",
    target_persona: "family_caregiver"
  },
  {
    slug: "care-robot-voice-recognition-dialect-tuning",
    title: "전라도·경상도 사투리 쓰시는 부모님, 돌봄로봇 말귀 알아듣게 만드는 설정법",
    main_keyword: "돌봄로봇 사투리 인식",
    target_persona: "family_caregiver"
  },
  {
    slug: "alone-elderly-heatwave-aircon-robot-alert",
    title: "한여름 폭염에 에어컨 안 켜시는 부모님, 돌봄로봇 열사병 경보 연동 기술",
    main_keyword: "돌봄로봇 폭염 예방",
    target_persona: "family_caregiver"
  },
  {
    slug: "senior-care-robot-cleaning-and-sanitizing",
    title: "세탁기에 넣으면 안 되는 돌봄로봇 인형, 때와 냄새 없애는 위생 살균법",
    main_keyword: "돌봄로봇 인형 세탁 소독",
    target_persona: "family_caregiver"
  }
];

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✅ Updated manifest.json. Total items: ${manifest.items.length}`);

// 3. Update topic-map.json with Batch 4
const topicMap = JSON.parse(fs.readFileSync(topicMapPath, 'utf8'));
const mapSlugs = new Set(topicMap.map(x => x.slug));

const batch4MapEntries = [
  {
    title: "돌봄로봇 배터리 과열과 폭발 걱정 없이 24시간 안전하게 충전하는 법",
    slug: "care-robot-battery-charging-safety-tips",
    primary_reader_situation: "부모님 댁에 돌봄로봇을 24시간 켜두어야 하는데 리튬이온 배터리 과열이나 화재가 발생할까 봐 늘 불안한 자녀",
    reader_job: "KC 인증 정품 어댑터 사용, 침구류 위 충전 금지, 과충전 방지 회로 점검 및 배터리 스웰링(부풀림) 이상 징후를 판별하는 일",
    decision_moment: "충전기를 상시 꽂아둘 것인가 잘 때만 꽂을 것인가, 배터리 교체 주기를 언제로 잡을 것인가",
    search_intent: "돌봄로봇을 24시간 상시 전원으로 안전하게 충전하고 배터리 수명을 늘리는 관리 수칙은 무엇인가",
    main_keyword: "돌봄로봇 배터리 충전",
    long_tail: "돌봄로봇 배터리 과열 방지 상시 충전 화재 예방",
    answer_claim: "KC 인증 정품 어댑터(5V 2A)를 사용하고 침대 매트리스나 이불 위가 아닌 단단한 탁자 위에 거치해야 하며, 2년 이상 사용 시 배터리 부풀림 여부를 점검해야 합니다.",
    evidence_plan: "한국소비자원 리튬이온 배터리 안전 실태조사, 소방청 전자기기 과열 화재 예방 수칙, 제조사 사용 설명서",
    information_gain: "안전 충전 4대 수칙 및 배터리 성능 저하 감별 3단계 체크리스트 제공",
    non_overlap_claim: "기존의 기능 소개와 달리 하드웨어 배터리 화학적 안전 관리와 화재 예방에 완전 특화",
    not_answered_here: "사설 배터리 납땜 교체 및 기판 수리",
    structure_type: "과열 위험 진단 → 안전 충전 4대 수칙 → 이상 징후 감별 매뉴얼 구조",
    internal_link_targets: [
      "/blog/care-robot-setup-guide-for-beginners",
      "/guide/mom-living-alone",
      "/info/how-companion-robots-work",
      "/ranking/senior-friendly"
    ]
  },
  {
    title: "지자체 스마트 돌봄 마을 사업: 우리 동네 어르신 무료 반려로봇 보급 기준",
    slug: "smart-village-rural-elderly-care-project",
    primary_reader_situation: "시골에 계신 부모님이 사시는 군·면에 스마트 돌봄마을 사업이 시작된다는 뉴스를 보고 무료 보급 자격을 확인하려는 자녀",
    reader_job: "과기정통부·행안부 스마트 빌리지 및 지자체 돌봄마을 공모 요건을 확인하고 읍면사무소를 통해 대상자 신청을 대리하는 일",
    decision_moment: "정부 지원 사업에 선정될 수 있는 우선순위 조건(독거, 고령, 취약계층)과 신청 기간 확인",
    search_intent: "지자체 스마트 돌봄 마을 사업을 통해 부모님이 무료로 돌봄로봇을 지원받는 신청 절차는 무엇인가",
    main_keyword: "스마트 돌봄마을 반려로봇",
    long_tail: "지자체 스마트 돌봄마을 사업 반려로봇 무료 신청 자격",
    answer_claim: "스마트 돌봄마을 사업은 농어촌 면 단위 거주 65세 이상 독거 어르신 및 취약계층을 1순위로 선발하며, 관할 행정복지센터 복지팀에서 상반기 정기 공모 시 신청할 수 있습니다.",
    evidence_plan: "과학기술정보통신부 스마트빌리지 보급 및 확산 사업 공고, 지자체 스마트시티 돌봄 조례",
    information_gain: "전국 지자체 스마트 빌리지 돌봄 보급 공통 선정 기준표 및 구비 서류 체크리스트 제공",
    non_overlap_claim: "기존의 도시형 복지관 지원과 달리 농어촌 스마트마을 단위 집단 보급 사업에 특화",
    not_answered_here: "도시 지역 민간 유상 렌탈",
    structure_type: "사업 개요 해설 → 우선순위 자격 기준 → 신청 서류 및 절차 매뉴얼 구조",
    internal_link_targets: [
      "/guide/dad-rural-residence",
      "/guide/social-worker-guide",
      "/blog/care-robot-support-programs-2024",
      "/support/region/seoul"
    ]
  },
  {
    title: "전라도·경상도 사투리 쓰시는 부모님, 돌봄로봇 말귀 알아듣게 만드는 설정법",
    slug: "care-robot-voice-recognition-dialect-tuning",
    primary_reader_situation: "시골에 거주하시며 억센 지역 방언(사투리)을 구사하시는 부모님이 로봇이 말을 못 알아듣는다고 답답해하시는 가족",
    reader_job: "기기 음성 인식 엔진의 방언 처리 한계를 보완하고 호출어 및 자주 쓰는 일상 사투리 표현을 앱 맞춤 단어로 등록하는 일",
    decision_moment: "표준어로 말씀하시도록 연습시킬 것인가, 기기 호출 감도와 마이크 설정을 튜닝할 것인가",
    search_intent: "지역 사투리를 쓰시는 어르신이 돌봄로봇 음성 인식을 원활하게 사용할 수 있는 설정 요령은 무엇인가",
    main_keyword: "돌봄로봇 사투리 인식",
    long_tail: "시골 부모님 경상도 전라도 사투리 돌봄로봇 음성인식 설정",
    answer_claim: "돌봄로봇의 마이크 감도를 최대로 높이고, 자주 하시는 방언 문장(예: 밥 묵었다, 머라카노)을 앱 맞춤 명령어로 등록하며 1m 이내에서 정면을 향해 발화하도록 유도해야 합니다.",
    evidence_plan: "국립국어원 방언 음성 데이터베이스 구축 현황, 주요 AI 스피커 한국어 방언 인식률 연구 논문",
    information_gain: "대표 사투리 표현 10종 기기 대응 매핑표 및 마이크 하울링 방지 거리 세팅법 제공",
    non_overlap_claim: "기존의 난청 튜닝과 달리 언어 음운학적 방언 인식 오류 극복 기술에 정밀 특화",
    not_answered_here: "외국어 및 다문화 언어 지원",
    structure_type: "방언 인식 장애 원인 분석 → 마이크 감도 튜닝 → 10대 일상 방언 매핑 매뉴얼 구조",
    internal_link_targets: [
      "/blog/parents-hearing-loss-voice-robot-tuning",
      "/guide/dad-rural-residence",
      "/info/how-companion-robots-work",
      "/ranking/senior-friendly"
    ]
  },
  {
    title: "한여름 폭염에 에어컨 안 켜시는 부모님, 돌봄로봇 열사병 경보 연동 기술",
    slug: "alone-elderly-heatwave-aircon-robot-alert",
    primary_reader_situation: "전기요금 누진세 걱정 때문에 폭염에도 에어컨을 끄고 선풍기만 틀고 계신 독거 부모님을 둔 자녀",
    reader_job: "돌봄로봇의 고온 감지 센서(30도 이상)와 스마트 리모컨(IoT 허브)을 연동하여 위험 실내 온도 도달 시 원격으로 에어컨을 켜는 일",
    decision_moment: "안부 전화로만 설득할 것인가, 원격 스마트 IoT 자동화로 강제 냉방을 가동할 것인가",
    search_intent: "돌봄로봇의 실내 온도 감지를 활용해 폭염 속 부모님의 온열질환을 원격으로 예방하는 기술적 방법은 무엇인가",
    main_keyword: "돌봄로봇 폭염 예방",
    long_tail: "독거노인 폭염 실내 고온 돌봄로봇 에어컨 원격 제어",
    answer_claim: "실내 온도가 30도 이상으로 치솟을 때 로봇이 자녀에게 폭염 비상 알림을 보내고, 만약 스마트플러그/IR 리모컨과 결합하면 자녀가 밖에서 26도 안심 모드로 에어컨을 원격 가동할 수 있습니다.",
    evidence_plan: "질병관리청 온열질환 응급실감시체계 연보(실내 발생 2위), 소방청 폭염 독거노인 구급 대책",
    information_gain: "실내 위험 온도별 3단계 폭염 대응 매트릭스 및 IoT 적외선 리모컨 연동 가이드 제공",
    non_overlap_claim: "겨울 한파와 대칭되는 여름철 온열질환 방지 실내 온도 원격 제어에 완전 특화",
    not_answered_here: "에어컨 냉매 가스 충전 및 실외기 수리",
    structure_type: "여름철 고령자 실내 열사병 위험 진단 → 로봇 고온 알림 설정 → 에어컨 원격 연동 가이드 구조",
    internal_link_targets: [
      "/blog/rural-solo-elderly-winter-freeze-robot",
      "/guide/mom-living-alone",
      "/guide/lonely-deaths-prevention",
      "/info/cognitive-health-support-tech"
    ]
  },
  {
    title: "세탁기에 넣으면 안 되는 돌봄로봇 인형, 때와 냄새 없애는 위생 살균법",
    slug: "senior-care-robot-cleaning-and-sanitizing",
    primary_reader_situation: "부모님이 매일 안고 주무셔서 땀과 음식물, 침으로 찌든 돌봄로봇 봉제인형을 세탁기 없이 위생적으로 세척하려는 가족",
    reader_job: "내부 전자 기판 침수와 배터리 손상 없이 외피를 분리하거나 천연 중성세제 폼과 스팀 타월로 찌든 때와 냄새를 안전하게 살균하는 일",
    decision_moment: "기기를 통째로 물에 빨 수 있는가, 제조사 전용 클리닝 키트나 외피 교체를 신청해야 하는가",
    search_intent: "전자 기계가 들어있는 봉제인형형 돌봄로봇을 고장 없이 깨끗하게 세탁하고 소독하는 방법은 무엇인가",
    main_keyword: "돌봄로봇 인형 세탁 소독",
    long_tail: "돌봄로봇 효돌 인형 세탁 세척 오염 냄새 제거 살균",
    answer_claim: "내부 배터리와 센서 기판이 물에 닿으면 영구 고장나므로 물세탁은 절대 불가하며, 벨크로를 열어 외피만 벗겨 중성세제 미온수 손세탁하거나 스팀 타월과 유아용 소독 티슈로 닦아내야 합니다.",
    evidence_plan: "제조사 공식 제품 유지관리 가이드, 한국의류시험연구원(KATRI) 섬유 살균 안전 기준",
    information_gain: "오염 유형별(음식물 얼룩, 냄새, 먼지 진드기) 3단계 안전 세척 매뉴얼 및 외피 분리 조립 요령 제공",
    non_overlap_claim: "기존의 사용법 글과 완전히 다른 하드웨어 위생 관리 및 기기 내구성 유지에 특화",
    not_answered_here: "기판 쇼트 수리 및 봉제선 수선",
    structure_type: "침수 고장 위험 경고 → 외피 분리 세탁법 → 외피 일체형 스팀 클리닝 매뉴얼 구조",
    internal_link_targets: [
      "/blog/care-robot-setup-guide-for-beginners",
      "/guide/mom-living-alone",
      "/ranking/senior-friendly",
      "/blog/hyodol-monthly-fee-breakdown"
    ]
  }
];

for (const entry of batch4MapEntries) {
  if (!mapSlugs.has(entry.slug)) {
    topicMap.push(entry);
  }
}
fs.writeFileSync(topicMapPath, JSON.stringify(topicMap, null, 2) + '\n');
console.log(`✅ Updated topic-map.json. Total count: ${topicMap.length}`);
