import type { NewComparison } from '../schema';

// robot_id 매핑 (robots 시드 삽입 순서 기준)
// 1=hyodol, 2=dasom-k, 3=dasom-b, 4=dasom-m, 5=kkumdoli
// 6=bomi, 7=raemi, 8=maibom, 9=aibo, 10=lovot, 11=moflin

export const comparisonsSeedData: Omit<NewComparison, 'id'>[] = [
  {
    slug: 'hyodol-vs-dasom-k',
    robot_a_id: 1, // hyodol
    robot_b_id: 2, // dasom-k
    title_ko: '효돌 vs 다솜K: 독거노인을 위한 국내 대표 돌봄로봇 비교',
    summary:
      '효돌은 친근한 인형 형태로 정서적 교감에 강점이 있고, 다솜K는 이동형 플랫폼과 센서 기반 생활 패턴 모니터링에 특화되어 있습니다. 혼자 사시는 어르신의 환경과 우선순위에 따라 선택하세요.',
    pros_a_json: JSON.stringify([
      '인형 형태로 거부감 없이 친근하게 접근',
      '국내 독거노인 보급사업에서 검증된 제품',
      '복약 알림·낙상 감지·응급 호출 통합 기능',
      '보호자 앱 완성도 높음',
      '전국 지자체 보급사업 연계 다수',
    ]),
    pros_b_json: JSON.stringify([
      '이동형 플랫폼으로 방 안 여러 위치 커버',
      '한국로봇융합연구원(정부 출연기관) 개발로 신뢰도 높음',
      '생활 패턴 장기 분석 기능 강점',
      '기관·시설 연계 프로그램 풍부',
    ]),
    recommended_persona:
      '정서적 말벗이 우선이라면 효돌, 이동형 모니터링과 기관 연계가 필요하다면 다솜K를 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-03-01'),
  },

  {
    slug: 'hyodol-vs-dasom-m',
    robot_a_id: 1, // hyodol
    robot_b_id: 4, // dasom-m
    title_ko: '효돌 vs 다솜M: 가정용 vs 시설용 돌봄로봇 완전 비교',
    summary:
      '효돌은 개인 가정에서 어르신 한 분을 집중 돌보는 데 최적화되었고, 다솜M은 요양원·복지관 등 시설 환경에서 다수 어르신을 동시에 모니터링하도록 설계되었습니다.',
    pros_a_json: JSON.stringify([
      '가정용 최적화, 1대1 집중 돌봄',
      '어르신 개인 맞춤 설정 용이',
      '구입·대여 방식 모두 가능',
      '친근한 외형으로 정서적 교감 우수',
      '지자체 무상 보급사업 연계 다수',
    ]),
    pros_b_json: JSON.stringify([
      '시설 환경에서 다수 어르신 동시 모니터링',
      '중앙 관제 연동 기능으로 직원 관리 편의',
      '낙상 감지 다구역 커버',
      '시설 도입 사업(B2G) 경험 풍부',
    ]),
    recommended_persona:
      '개인 가정 또는 소규모 환경이라면 효돌, 요양원·복지관 등 기관 도입이라면 다솜M을 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-03-05'),
  },

  {
    slug: 'hyodol-vs-raemi',
    robot_a_id: 1, // hyodol
    robot_b_id: 7, // raemi
    title_ko: '효돌 vs 래미: 말벗·돌봄 로봇 vs 재활 보조 로봇',
    summary:
      '효돌은 AI 대화·복약 알림·낙상 감지 등 종합 돌봄 기능에 특화되었고, 래미는 상지 재활 운동을 돕는 웨어러블 재활 보조 로봇입니다. 목적이 완전히 다른 두 제품입니다.',
    pros_a_json: JSON.stringify([
      '일상 생활 전반 돌봄 통합 솔루션',
      '사용 방법이 단순 (전원만 켜면 됨)',
      '정서적 교감과 생활 지원 동시 제공',
      '보급사업 연계 용이',
    ]),
    pros_b_json: JSON.stringify([
      '상지 근력 회복에 특화된 재활 보조',
      '운동 데이터 기록 및 의료진 공유',
      '병원·재활센터 연계 사용 가능',
      '퇴원 후 가정 재활에 활용 가능',
    ]),
    recommended_persona:
      '일상 말벗·안전 관리가 목적이라면 효돌, 뇌졸중·골절 등 회복 후 상지 재활이 목적이라면 래미를 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-03-10'),
  },

  {
    slug: 'dasom-k-vs-dasom-b',
    robot_a_id: 2, // dasom-k
    robot_b_id: 3, // dasom-b
    title_ko: '다솜K vs 다솜B: 같은 제조사 두 모델, 무엇이 다른가?',
    summary:
      '한국로봇융합연구원의 두 모델 중 다솜K는 이동형 생활 모니터링 범용 모델이고, 다솜B는 배회 감지와 위치 추적에 특화된 모델입니다. 어르신의 상태에 따라 선택이 달라집니다.',
    pros_a_json: JSON.stringify([
      '이동형 플랫폼으로 넓은 공간 커버',
      '생활 패턴 종합 분석 기능',
      '복약·안부 등 일상 기능 통합',
      '범용적 활용 가능',
    ]),
    pros_b_json: JSON.stringify([
      '배회 감지 특화로 안전사고 예방 강점',
      '위치 추적 기능으로 실시간 위치 파악',
      '인지 건강 지원이 필요한 어르신에게 적합',
      '보호자 즉시 알림 체계 강화',
    ]),
    recommended_persona:
      '건강한 독거 어르신 전반적 모니터링이라면 다솜K, 배회·실종 위험이 걱정되는 어르신이라면 다솜B를 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-03-15'),
  },

  {
    slug: 'dasom-m-vs-maibom',
    robot_a_id: 4, // dasom-m
    robot_b_id: 8, // maibom
    title_ko: '다솜M vs 마이봄: 시설형 모니터링 로봇 vs 소형 AI 반려 로봇',
    summary:
      '다솜M은 시설 환경의 다수 어르신 모니터링을 위한 대형 플랫폼이고, 마이봄은 소형 AI 감성 인식 로봇으로 개인 친밀감에 특화되어 있습니다. 사용 환경과 목적이 다른 두 제품입니다.',
    pros_a_json: JSON.stringify([
      '시설 다수 어르신 동시 모니터링',
      '중앙 관제 대시보드 연동',
      '낙상 감지 광역 커버',
      '기관 도입 검증 실적',
    ]),
    pros_b_json: JSON.stringify([
      '소형·경량으로 가정에서 어디서나 사용',
      '감성 인식 AI로 어르신 기분 맞춤 대화',
      'LED 표정으로 시각적 감성 전달',
      '가격 경쟁력 높음',
    ]),
    recommended_persona:
      '복지관·요양원 시설 도입이라면 다솜M, 가정에서 개인 AI 말벗이라면 마이봄을 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-03-20'),
  },

  {
    slug: 'hyodol-vs-maibom',
    robot_a_id: 1, // hyodol
    robot_b_id: 8, // maibom
    title_ko: '효돌 vs 마이봄: 가정용 돌봄로봇 인기 모델 2종 비교',
    summary:
      '효돌은 국내 돌봄로봇 시장 선두주자로 다양한 안전 기능과 보급사업 연계에 강점이 있고, 마이봄은 감성 인식 AI 기술로 정서적 교감에 집중한 소형 반려 로봇입니다.',
    pros_a_json: JSON.stringify([
      '오랜 보급 역사로 현장 검증 충분',
      '낙상 감지·응급 호출 통합 안전 기능',
      '지자체 보급사업 연계 가장 많음',
      '전국 A/S 네트워크 안정적',
      '보호자 앱 기능 풍부',
    ]),
    pros_b_json: JSON.stringify([
      '감성 인식으로 어르신 기분 파악 대화',
      '소형 경량 디자인으로 어디서나 활용',
      'LED 표정 표현으로 시각적 감성 전달',
      '비교적 낮은 가격',
    ]),
    recommended_persona:
      '안전 기능과 보급사업 연계가 중요하다면 효돌, 감성 교감 중심의 소형 로봇을 원하다면 마이봄을 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-04-01'),
  },

  {
    slug: 'bomi-vs-kkumdoli',
    robot_a_id: 6, // bomi
    robot_b_id: 5, // kkumdoli
    title_ko: '보미 vs 꿈돌이: AI 돌봄 로봇 두 모델 비교',
    summary:
      '보미는 AI 자연어 대화와 건강 관리 기능이 통합된 어르신 전용 돌봄 로봇이고, 꿈돌이는 감성 케어와 표정 인식·원격 화상 통화를 지원하는 소통 중심 로봇입니다.',
    pros_a_json: JSON.stringify([
      'AI 자연어 대화 품질 우수',
      '복약 관리·건강 설문 통합',
      '긴급 SOS 기능',
      '독거노인 특화 설계',
    ]),
    pros_b_json: JSON.stringify([
      '표정 인식으로 감성적 반응',
      '원격 화상 통화 지원으로 가족 소통',
      '노래·동화 등 엔터테인먼트 기능',
      '아동·노인 모두 활용 가능',
    ]),
    recommended_persona:
      '건강 관리와 돌봄 통합이 필요하다면 보미, 가족 화상 통화와 감성 교감이 우선이라면 꿈돌이를 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-04-05'),
  },

  {
    slug: 'raemi-vs-maibom',
    robot_a_id: 7, // raemi
    robot_b_id: 8, // maibom
    title_ko: '래미 vs 마이봄: 재활 보조 로봇 vs AI 감성 반려 로봇',
    summary:
      '래미와 마이봄은 목적이 전혀 다른 두 로봇입니다. 래미는 상지 재활을 위한 웨어러블 의료 보조 기기에 가깝고, 마이봄은 정서적 교감을 위한 소형 AI 반려 로봇입니다.',
    pros_a_json: JSON.stringify([
      '상지 재활 운동에 특화된 기능',
      '운동 횟수·강도 데이터 기록',
      '의료진 원격 모니터링 가능',
      '뇌졸중·골절 회복에 활용',
    ]),
    pros_b_json: JSON.stringify([
      '감성 인식 AI로 정서적 위안',
      '소형으로 이동이 편리',
      '가격 접근성 높음',
      '건강한 어르신도 즐겁게 사용',
    ]),
    recommended_persona:
      '질환 후 재활이 목적이라면 래미(의료진 상담 후), 일상 정서적 교감이 목적이라면 마이봄을 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-04-10'),
  },

  {
    slug: 'aibo-vs-lovot',
    robot_a_id: 9,  // aibo
    robot_b_id: 10, // lovot
    title_ko: 'aibo vs LOVOT: 일본 대표 감성 반려 로봇 비교',
    summary:
      '소니의 aibo는 강아지 형태의 AI 반려 로봇으로 딥러닝 기반 개성 학습이 특징이고, GROOVE X의 LOVOT은 체온 발열 기능과 안기는 촉각 경험을 제공하는 감성 로봇입니다. 두 제품 모두 한국 공식 출시는 없지만 수입 구매가 가능합니다.',
    pros_a_json: JSON.stringify([
      '딥러닝으로 주인과 함께 성장하는 개성',
      '강아지 형태로 친숙한 외형',
      '소니 브랜드 신뢰도',
      '앱 연동 및 클라우드 AI 업데이트',
    ]),
    pros_b_json: JSON.stringify([
      '체온 발열로 실제 안는 따뜻한 촉각 경험',
      '풍부한 감정 표현과 눈 접촉',
      '여러 명 얼굴 인식 및 개별 반응',
      '정서적 유대감 형성 탁월',
    ]),
    recommended_persona:
      '딥러닝 성장형 AI 동반자를 원한다면 aibo, 따뜻한 신체 접촉과 감정 교감을 원한다면 LOVOT을 권장합니다. 단, 두 제품 모두 한국 공식 A/S가 없으므로 유의하세요.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-04-15'),
  },

  {
    slug: 'lovot-vs-moflin',
    robot_a_id: 10, // lovot
    robot_b_id: 11, // moflin
    title_ko: 'LOVOT vs Moflin: 감성 교감 로봇 두 모델 비교',
    summary:
      'LOVOT은 체온 발열과 풍부한 감정 표현을 갖춘 고급 감성 로봇이고, Moflin은 털뭉치 형태로 AI 감정 학습을 통해 성장하는 소형 감성 로봇입니다. 가격과 크기에서 큰 차이가 있습니다.',
    pros_a_json: JSON.stringify([
      '체온 발열 기능으로 실제 생명체 느낌',
      '360도 카메라로 환경·사람 인식',
      '충전 도크 자율 복귀',
      '프리미엄 품질과 내구성',
    ]),
    pros_b_json: JSON.stringify([
      '소형 경량으로 어디서나 들고 다닐 수 있음',
      'AI 감정 학습으로 각자 다른 개성 형성',
      '상대적으로 낮은 가격',
      '털 소재로 촉감이 부드럽고 아늑함',
    ]),
    recommended_persona:
      '예산이 충분하고 프리미엄 감성 경험을 원한다면 LOVOT, 저렴하게 작은 AI 감성 로봇을 원한다면 Moflin을 권장합니다.',
    author_id: 1,
    reviewer_id: 2,
    published_at: new Date('2024-04-20'),
  },
];
