export const meta = {
  name: 'generate-blog-100',
  description: '돌봄지기 블로그 신규 글 100개를 article-writer 원칙으로 대량 생성 (Researcher→Writer→Editor, 품질 90점, 의료표현 금지)',
  phases: [
    { title: 'Research', detail: '글별 1차 데이터 5종 추출' },
    { title: 'Write', detail: '마크다운 본문 생성 (매크로/렌즈/훅/아웃트로)' },
    { title: 'Edit', detail: '품질 90점 채점 + 의료표현/클리셰 검증' },
  ],
}

// 토픽 100개 임베드 (blog-topics.json과 동일). args = { startIndex, count }로 배치 제어
const ALL_TOPICS = [
  {"slug":"diabetes-senior-care-robot","title":"당뇨 어르신 돌봄로봇, 식사·복약 알림은 얼마나 챙겨줄까","subtitle":"당뇨 관리가 필요한 어르신의 복약 알림과 식사 시간 안내 기능 점검","main_keyword":"당뇨 어르신 돌봄로봇","related_keywords":["복약 알림 로봇","식사 시간 안내","어르신 일과 관리"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"night-wandering-elderly-monitoring","title":"밤마다 집을 나서는 어르신, 돌봄로봇이 알아챌 수 있을까","subtitle":"야간 배회 어르신의 움직임 감지와 보호자 알림 기능 자세히 보기","main_keyword":"야간 배회 어르신","related_keywords":["움직임 감지","야간 모니터링","보호자 알림"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"robot-medication-reminder-feature","title":"약 챙기기 어려운 어르신, 복약 알림 로봇 기능 총정리","subtitle":"약 복용 시간 안내와 복약 확인 기능을 갖춘 돌봄로봇 비교","main_keyword":"복약 알림 로봇","related_keywords":["약 복용 알림","복약 확인 기능","어르신 건강 관리"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"fall-detection-sensor-explained","title":"넘어지면 바로 알려준다는 낙상 감지, 어떻게 작동하나","subtitle":"돌봄로봇의 낙상 감지 센서 원리와 정확도, 한계 짚어보기","main_keyword":"낙상 감지 로봇","related_keywords":["낙상 감지 센서","어르신 안전","응급 알림"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"companion-robot-conversation-quality","title":"말벗 기능, 정말 어르신과 대화가 통할까","subtitle":"돌봄로봇 음성 대화 기능의 실제 수준과 외로움 완화 효과","main_keyword":"말벗 기능 로봇","related_keywords":["음성 대화","어르신 외로움","정서 지원"],"category":"care_info","target_persona":"all"},
  {"slug":"voice-recognition-for-elderly-dialect","title":"사투리도 알아들을까? 어르신 음성인식의 현실","subtitle":"고령자 발화 특성과 사투리 인식 정확도를 높이는 음성 기능","main_keyword":"어르신 음성인식","related_keywords":["사투리 인식","고령자 발화","음성 명령"],"category":"care_info","target_persona":"all"},
  {"slug":"indoor-temperature-safety-monitoring","title":"여름 폭염·겨울 한파, 돌봄로봇이 실내 온도를 지켜본다","subtitle":"독거 어르신 실내 온습도 감지와 온열·한랭 위험 알림 기능","main_keyword":"실내 온도 감지","related_keywords":["폭염 대응","독거 안전","환경 모니터링"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"loneliness-emotional-support-tech","title":"혼자 사는 시간이 길어질수록, 정서 지원 기술이 하는 일","subtitle":"독거 어르신의 고독감을 덜어주는 돌봄로봇 정서 지원 기능 정리","main_keyword":"정서 지원 기술","related_keywords":["고독감 완화","독거 어르신","감정 케어"],"category":"care_info","target_persona":"all"},
  {"slug":"daily-routine-check-feature","title":"오늘 하루 잘 지내셨나요, 일과 확인 기능의 쓸모","subtitle":"어르신 기상·식사·활동 패턴을 살피는 일과 확인 기능 안내","main_keyword":"일과 확인 기능","related_keywords":["생활 패턴","안부 확인","어르신 일상"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"cognitive-health-support-games","title":"두뇌 활동 콘텐츠, 돌봄로봇으로 매일 즐기는 법","subtitle":"어르신 인지 건강 지원을 위한 퀴즈·회상 콘텐츠 활용 가이드","main_keyword":"인지 건강 지원 콘텐츠","related_keywords":["두뇌 활동","회상 콘텐츠","어르신 두뇌 자극"],"category":"care_info","target_persona":"all"},
  {"slug":"emergency-alert-call-flow","title":"위급한 순간, 돌봄로봇은 누구에게 어떻게 연락할까","subtitle":"응급 상황 감지부터 보호자·119 연계까지 알림 흐름 정리","main_keyword":"응급 알림 로봇","related_keywords":["응급 상황 감지","119 연계","보호자 연락"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"sleep-pattern-monitoring-senior","title":"잠은 잘 주무시나, 수면 패턴 살피는 돌봄 기술","subtitle":"어르신 수면 시간·뒤척임을 감지하는 비접촉 모니터링 기능","main_keyword":"수면 패턴 감지","related_keywords":["수면 모니터링","어르신 건강 신호","비접촉 센서"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"hearing-impaired-elderly-features","title":"귀가 어두운 어르신을 위한 돌봄로봇 기능은","subtitle":"청력이 약한 어르신을 위한 큰 글씨·진동·시각 알림 지원","main_keyword":"청력 약한 어르신 로봇","related_keywords":["시각 알림","진동 알림","큰 글씨 화면"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"hydration-meal-reminder-summer","title":"물 한 잔 챙기기, 돌봄로봇의 수분·식사 안내 기능","subtitle":"어르신 탈수를 막아주는 수분 섭취·식사 시간 안내 기능 점검","main_keyword":"수분 섭취 안내","related_keywords":["식사 안내","탈수 주의","어르신 건강 습관"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"video-call-feature-for-family","title":"버튼 하나로 자녀와 영상통화, 어르신도 쉬울까","subtitle":"복잡한 조작 없이 가족과 연결되는 돌봄로봇 영상통화 기능","main_keyword":"어르신 영상통화 로봇","related_keywords":["가족 연결","원격 소통","간편 통화"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"privacy-data-handling-care-robot","title":"돌봄로봇이 우리 집을 다 본다? 개인정보 처리 짚어보기","subtitle":"카메라·음성 데이터 수집 범위와 어르신 사생활 보호 기준","main_keyword":"돌봄로봇 개인정보","related_keywords":["데이터 보호","사생활 보호","카메라 정보"],"category":"care_info","target_persona":"all"},
  {"slug":"battery-charging-maintenance-tips","title":"충전·관리, 돌봄로봇 오래 쓰는 작은 습관들","subtitle":"배터리 관리부터 청소까지 돌봄로봇 일상 유지 관리 요령","main_keyword":"돌봄로봇 관리","related_keywords":["배터리 충전","기기 청소","유지 관리"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"early-cognitive-change-signs-response","title":"어르신의 작은 변화, 돌봄로봇이 먼저 알아챌 수 있을까","subtitle":"인지 건강 변화 초기 신호를 살피는 생활 데이터 활용법","main_keyword":"인지 건강 변화 신호","related_keywords":["생활 데이터","어르신 상태 확인","조기 발견"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"robot-vs-human-care-roles","title":"돌봄로봇이 사람을 대신할까, 역할의 경계 정리","subtitle":"돌봄로봇이 채우는 빈틈과 사람 돌봄이 필요한 영역 구분","main_keyword":"돌봄로봇 역할","related_keywords":["사람 돌봄","돌봄 공백","보완 역할"],"category":"care_info","target_persona":"all"},
  {"slug":"stroke-recovery-daily-support-robot","title":"뇌졸중 회복기 어르신, 일상 복귀를 돕는 돌봄 기능","subtitle":"회복기 어르신의 일과 안내와 활동 독려를 위한 돌봄로봇 활용","main_keyword":"회복기 돌봄로봇","related_keywords":["일상 복귀 지원","활동 독려","어르신 재활 일과"],"category":"care_info","target_persona":"family_caregiver"},
  {"slug":"hyodol-monthly-fee-breakdown","title":"효돌 월 사용료, 진짜 얼마나 들까 따져봤다","subtitle":"효돌 구매가·월 이용료·통신비까지 실제 비용 구조 분석","main_keyword":"효돌 월 사용료","related_keywords":["효돌 가격","이용료 비교","통신비"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"rental-vs-purchase-care-robot","title":"돌봄로봇, 렌탈이 나을까 구매가 나을까","subtitle":"사용 기간별 렌탈과 구매 비용을 비교한 선택 기준","main_keyword":"돌봄로봇 렌탈 vs 구매","related_keywords":["렌탈 비용","구매 비용","장기 사용"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"care-robot-price-comparison-2026","title":"2026년 돌봄로봇 가격 비교, 한눈에 정리했다","subtitle":"주요 돌봄로봇 모델의 가격대와 월 유지비를 한 표로 비교","main_keyword":"돌봄로봇 가격 비교","related_keywords":["모델별 가격","유지비","가성비 로봇"],"category":"product_review","target_persona":"all"},
  {"slug":"budget-care-robot-recommendation","title":"100만 원 이하 돌봄로봇, 쓸만한 모델 골라봤다","subtitle":"예산이 빠듯할 때 고려할 보급형 돌봄로봇 기능과 한계","main_keyword":"저가 돌봄로봇","related_keywords":["보급형 로봇","가성비","예산 돌봄로봇"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"fall-detection-robot-top-picks","title":"낙상 감지가 강점인 돌봄로봇, 어떤 게 좋을까","subtitle":"낙상 감지 정확도와 응급 알림 속도로 비교한 추천 모델","main_keyword":"낙상 감지 로봇 추천","related_keywords":["낙상 감지 비교","응급 알림 속도","안전 기능"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"lovot-real-user-experience","title":"LOVOT, 한 달 살아보니 어땠나","subtitle":"정서 교감형 로봇 LOVOT의 실사용 장단점과 어르신 반응","main_keyword":"LOVOT 사용 후기","related_keywords":["정서 교감 로봇","실사용 후기","어르신 반응"],"category":"product_review","target_persona":"all"},
  {"slug":"dasom-feature-deep-dive","title":"다솜, 화면 너머 어떤 기능이 숨어 있나","subtitle":"다솜 시리즈의 화면 안내·건강 체크 기능을 자세히 살펴본 리뷰","main_keyword":"다솜 기능 리뷰","related_keywords":["다솜 화면 기능","건강 체크","다솜 활용"],"category":"product_review","target_persona":"all"},
  {"slug":"screen-type-vs-doll-type-robot","title":"화면형 vs 인형형 돌봄로봇, 어르신은 뭘 더 좋아할까","subtitle":"디스플레이형과 봉제 인형형 돌봄로봇의 사용감 비교","main_keyword":"화면형 인형형 비교","related_keywords":["디스플레이 로봇","인형형 로봇","사용감"],"category":"product_review","target_persona":"all"},
  {"slug":"moflin-vs-paro-comfort-robot","title":"모플린과 파로, 위로형 로봇 둘 중 하나 고른다면","subtitle":"교감 중심 위로형 로봇 모플린과 파로의 차이점 정리","main_keyword":"모플린 파로 비교","related_keywords":["위로형 로봇","교감 로봇","정서 케어 기기"],"category":"product_review","target_persona":"all"},
  {"slug":"care-robot-after-sales-service","title":"고장 나면 어쩌지, 돌봄로봇 AS 비교해봤다","subtitle":"주요 브랜드의 보증 기간·수리 절차·고객센터 대응 비교","main_keyword":"돌봄로봇 AS 비교","related_keywords":["보증 기간","수리 절차","고객센터"],"category":"product_review","target_persona":"all"},
  {"slug":"ai-speaker-vs-care-robot","title":"AI 스피커로 충분할까, 돌봄로봇과 솔직 비교","subtitle":"AI 스피커와 전용 돌봄로봇의 안부·안전 기능 차이 분석","main_keyword":"AI 스피커 vs 돌봄로봇","related_keywords":["인공지능 스피커","안부 기능","안전 기능 차이"],"category":"product_review","target_persona":"all"},
  {"slug":"best-care-robot-for-solo-living","title":"독거 어르신에게 딱 맞는 돌봄로봇, 추려봤다","subtitle":"혼자 지내는 어르신에게 필요한 안전·안부 기능 중심 추천","main_keyword":"독거 어르신 돌봄로봇","related_keywords":["1인 가구 어르신","안부 확인","안전 기능 추천"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"robot-with-best-conversation","title":"대화가 제일 자연스러운 돌봄로봇은 어느 거였나","subtitle":"음성 대화 품질을 기준으로 비교한 말벗 중심 돌봄로봇","main_keyword":"대화형 돌봄로봇 비교","related_keywords":["음성 대화 품질","말벗 로봇","자연어 대화"],"category":"product_review","target_persona":"all"},
  {"slug":"care-robot-design-for-seniors","title":"어르신이 쓰기 편한 디자인, 어느 로봇이 잘했나","subtitle":"버튼 크기·무게·조작 난이도로 따진 어르신 친화 디자인 비교","main_keyword":"어르신 친화 디자인","related_keywords":["조작 편의성","무게","버튼 크기"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"institution-grade-robot-comparison","title":"기관용 돌봄로봇, 가정용과 뭐가 다를까","subtitle":"복지관·요양원 대량 도입 관점에서 본 기관용 모델 비교","main_keyword":"기관용 돌봄로봇","related_keywords":["대량 도입","복지관 모델","관리 콘솔"],"category":"product_review","target_persona":"institution"},
  {"slug":"data-dashboard-feature-review","title":"보호자 앱·관리 대시보드, 어느 제품이 잘 만들었나","subtitle":"수집 데이터 시각화와 알림 설정 측면에서 본 앱 사용성 비교","main_keyword":"돌봄로봇 보호자 앱","related_keywords":["관리 대시보드","데이터 시각화","알림 설정"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"warranty-and-subscription-models","title":"구독형 돌봄로봇, 약정과 해지 조건 꼼꼼히 봤다","subtitle":"월 구독 모델의 약정 기간·위약금·해지 절차 비교 분석","main_keyword":"구독형 돌봄로봇","related_keywords":["월 구독","약정 조건","해지 위약금"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"robot-noise-and-volume-test","title":"밤에 시끄럽진 않을까, 돌봄로봇 소음 비교해봤다","subtitle":"동작음·알림음 크기를 측정해 비교한 정숙성 리뷰","main_keyword":"돌봄로봇 소음","related_keywords":["동작음","알림음 크기","정숙성"],"category":"product_review","target_persona":"all"},
  {"slug":"domestic-vs-overseas-care-robot","title":"국산 돌봄로봇 vs 해외 모델, 한국 어르신에겐 뭐가 맞나","subtitle":"언어·문화·AS 측면에서 국산과 수입 돌봄로봇을 비교","main_keyword":"국산 해외 돌봄로봇","related_keywords":["수입 로봇","언어 지원","국내 AS"],"category":"product_review","target_persona":"all"},
  {"slug":"two-year-old-robot-resale-value","title":"중고 돌봄로봇, 사도 괜찮을까","subtitle":"중고 거래 시 점검할 사항과 보증·소프트웨어 지원 여부","main_keyword":"중고 돌봄로봇","related_keywords":["중고 거래","보증 승계","소프트웨어 지원"],"category":"product_review","target_persona":"family_caregiver"},
  {"slug":"care-robot-eligibility-requirements","title":"돌봄로봇 지원, 우리 부모님도 받을 수 있을까","subtitle":"연령·소득·돌봄 상황별 보급 지원 신청 자격 조건 정리","main_keyword":"돌봄로봇 신청 자격","related_keywords":["지원 자격 조건","소득 기준","연령 기준"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"how-to-apply-for-subsidy","title":"돌봄로봇 보조금 받는 법, 처음부터 끝까지","subtitle":"보조금 신청 절차와 단계별 준비 사항을 차근차근 안내","main_keyword":"돌봄로봇 보조금","related_keywords":["보조금 신청","신청 절차","지원금 받는 법"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"application-documents-checklist","title":"돌봄로봇 신청 서류, 뭘 준비해야 하나","subtitle":"신청에 필요한 서류 목록과 발급처를 한 번에 정리","main_keyword":"돌봄로봇 신청 서류","related_keywords":["필요 서류","서류 발급처","신청 준비물"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"seoul-care-robot-application","title":"서울에서 돌봄로봇 신청하기, 어디서 어떻게","subtitle":"서울시 보급사업 신청 창구와 접수 방법을 정리한 안내","main_keyword":"서울 돌봄로봇 신청","related_keywords":["서울시 보급사업","신청 창구","접수 방법"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"gyeonggi-distribution-program","title":"경기도 돌봄로봇 보급사업, 올해는 어떻게 바뀌나","subtitle":"경기도 시군별 돌봄로봇 보급사업 대상과 신청 일정 정리","main_keyword":"경기도 돌봄로봇 보급","related_keywords":["경기도 지원사업","시군별 보급","신청 일정"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"busan-care-robot-support","title":"부산 어르신 돌봄로봇 지원, 신청 전 확인할 것","subtitle":"부산시 돌봄로봇 지원 대상과 우선순위 기준 안내","main_keyword":"부산 돌봄로봇 지원","related_keywords":["부산시 지원사업","우선순위 기준","지원 대상"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"long-term-care-insurance-link","title":"장기요양보험으로 돌봄로봇도 지원받을 수 있나","subtitle":"장기요양 등급과 복지용구 연계 가능성 짚어보기","main_keyword":"장기요양보험 돌봄로봇","related_keywords":["복지용구 연계","요양 등급","급여 지원"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"application-result-waiting-time","title":"신청하면 언제 받나, 돌봄로봇 보급 대기 기간","subtitle":"접수부터 설치까지 걸리는 기간과 대기 순번 확인 방법","main_keyword":"돌봄로봇 대기 기간","related_keywords":["보급 일정","대기 순번","설치 시기"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"rejected-application-next-steps","title":"지원 신청이 떨어졌다면, 다음으로 할 수 있는 것","subtitle":"선정에서 제외됐을 때 재신청과 대안 지원을 찾는 방법","main_keyword":"돌봄로봇 신청 탈락","related_keywords":["재신청","대안 지원","선정 제외"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"income-criteria-explained","title":"기초생활수급자·차상위, 돌봄로봇 지원 우선순위는","subtitle":"소득 기준에 따른 돌봄로봇 보급 우선순위와 추가 혜택","main_keyword":"돌봄로봇 소득 기준","related_keywords":["기초생활수급","차상위계층","우선 지원"],"category":"support_program","target_persona":"social_worker"},
  {"slug":"social-worker-application-support","title":"사회복지사가 대신 신청해도 될까, 대리 신청 절차","subtitle":"보호자 대신 사회복지사가 진행하는 대리 신청 요건 정리","main_keyword":"돌봄로봇 대리 신청","related_keywords":["사회복지사 신청","대리 접수","위임 절차"],"category":"support_program","target_persona":"social_worker"},
  {"slug":"national-vs-local-support-difference","title":"국가 지원과 지자체 지원, 뭐가 다르고 중복되나","subtitle":"중앙정부와 지방자치단체 돌봄로봇 지원의 차이와 중복 여부","main_keyword":"국가 지자체 지원 차이","related_keywords":["중앙정부 지원","지방자치단체","중복 수혜"],"category":"support_program","target_persona":"all"},
  {"slug":"institution-bulk-procurement-grant","title":"복지관·요양원이 돌봄로봇 대량 도입할 때 받는 지원","subtitle":"기관 대상 보급 지원사업과 신청 자격, 자부담 비율 정리","main_keyword":"기관 돌봄로봇 지원","related_keywords":["대량 도입 지원","자부담 비율","기관 신청"],"category":"support_program","target_persona":"institution"},
  {"slug":"self-pay-cost-after-subsidy","title":"보조금 받아도 내가 낼 돈은 얼마나 될까","subtitle":"지원금 차감 후 실제 자부담 비용을 모델별로 계산","main_keyword":"돌봄로봇 자부담","related_keywords":["본인 부담금","지원금 차감","실비용"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"application-period-calendar-2026","title":"2026년 돌봄로봇 신청 일정, 놓치지 말아야 할 시기","subtitle":"주요 지자체별 접수 기간을 한눈에 보는 신청 달력","main_keyword":"2026 돌봄로봇 신청 일정","related_keywords":["접수 기간","신청 달력","지자체 일정"],"category":"support_program","target_persona":"all"},
  {"slug":"rural-area-support-availability","title":"농어촌 어르신도 돌봄로봇 지원받을 수 있을까","subtitle":"통신 환경이 열악한 농어촌 지역의 보급 지원 가능 범위","main_keyword":"농어촌 돌봄로봇 지원","related_keywords":["농어촌 보급","통신 환경","지역 격차"],"category":"support_program","target_persona":"public_servant"},
  {"slug":"online-application-step-by-step","title":"온라인으로 돌봄로봇 신청하기, 화면 따라 해보자","subtitle":"복지로·지자체 누리집에서 진행하는 온라인 신청 단계 안내","main_keyword":"돌봄로봇 온라인 신청","related_keywords":["복지로 신청","누리집 접수","온라인 절차"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"support-program-for-caregivers","title":"돌봄 부담 던다, 가족돌봄자도 받을 수 있는 연계 지원","subtitle":"돌봄로봇과 함께 활용할 수 있는 가족돌봄자 지원 제도 정리","main_keyword":"가족돌봄자 지원","related_keywords":["돌봄 부담","연계 제도","가족 지원"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"renew-extend-existing-support","title":"지원받던 돌봄로봇, 기간 끝나면 어떻게 되나","subtitle":"지원 종료 후 연장·반납·재신청 선택지를 정리한 안내","main_keyword":"돌봄로봇 지원 연장","related_keywords":["지원 종료","기기 반납","재신청"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"free-trial-and-demo-programs","title":"사기 전에 써본다, 돌봄로봇 체험·대여 프로그램","subtitle":"구매 전 무료 체험이나 단기 대여가 가능한 지원 경로 안내","main_keyword":"돌봄로봇 체험 프로그램","related_keywords":["무료 체험","단기 대여","시범 운영"],"category":"support_program","target_persona":"family_caregiver"},
  {"slug":"first-week-setup-guide","title":"돌봄로봇 들인 첫 일주일, 이렇게 하면 자리잡는다","subtitle":"설치 직후 어르신 적응을 돕는 초기 일주일 세팅 가이드","main_keyword":"돌봄로봇 초기 설정","related_keywords":["적응 기간","초기 세팅","사용 습관"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"wifi-connection-troubleshooting","title":"와이파이가 안 잡힐 때, 돌봄로봇 연결 문제 해결법","subtitle":"통신 연결 오류 원인별 점검 순서와 해결 방법 안내","main_keyword":"돌봄로봇 연결 문제","related_keywords":["와이파이 연결","통신 오류","네트워크 점검"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"choosing-by-care-situation","title":"우리 어르신 상황별, 돌봄로봇 고르는 결정 트리","subtitle":"독거·동거·거동 상태에 따라 맞는 돌봄로봇을 찾는 선택 흐름","main_keyword":"상황별 돌봄로봇 선택","related_keywords":["선택 기준","돌봄 상황","맞춤 추천"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"must-check-before-buying","title":"돌봄로봇 사기 전 반드시 확인할 7가지","subtitle":"구매 실패를 막기 위해 점검할 기능·비용·AS 체크 항목","main_keyword":"돌봄로봇 구매 체크리스트","related_keywords":["구매 전 점검","확인 사항","구매 실패"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"setting-up-guardian-alerts","title":"보호자 알림, 너무 많지도 적지도 않게 설정하는 법","subtitle":"꼭 필요한 알림만 받도록 보호자 알림을 조정하는 설정 가이드","main_keyword":"보호자 알림 설정","related_keywords":["알림 조정","알림 피로","맞춤 알림"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"helping-elderly-accept-robot","title":"어르신이 로봇을 거부할 때, 마음 여는 방법","subtitle":"낯선 기기를 꺼리는 어르신의 거부감을 줄이는 접근법","main_keyword":"어르신 로봇 거부감","related_keywords":["적응 돕기","거부감 완화","사용 권유"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"smarthome-integration-guide","title":"돌봄로봇과 스마트홈 연동, 어디까지 가능할까","subtitle":"조명·도어센서 등 스마트홈 기기와 돌봄로봇을 연결하는 법","main_keyword":"돌봄로봇 스마트홈 연동","related_keywords":["스마트홈 기기","IoT 연동","홈 자동화"],"category":"guide","target_persona":"all"},
  {"slug":"placement-in-home-tips","title":"돌봄로봇 어디에 둘까, 집 안 배치 요령","subtitle":"센서 감지와 어르신 동선을 고려한 돌봄로봇 설치 위치 안내","main_keyword":"돌봄로봇 설치 위치","related_keywords":["배치 요령","센서 범위","어르신 동선"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"remote-management-from-abroad","title":"해외에 살아도 부모님을 돌볼 수 있을까, 원격 관리 가이드","subtitle":"시차와 거리를 넘어 해외에서 돌봄로봇을 관리하는 방법","main_keyword":"해외 원격 돌봄","related_keywords":["원격 관리","시차 돌봄","재외국민 돌봄"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"elderly-couple-shared-use","title":"노부부가 함께 쓸 때, 돌봄로봇 설정은 이렇게","subtitle":"두 어르신이 한 대를 같이 사용할 때 계정·알림 설정 요령","main_keyword":"노부부 돌봄로봇","related_keywords":["다중 사용자","공동 사용","계정 설정"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"winter-safety-checklist-with-robot","title":"겨울철 독거 안전 점검, 돌봄로봇과 함께 챙기기","subtitle":"한파·난방 안전을 돌봄로봇 알림과 연계해 점검하는 가이드","main_keyword":"겨울 독거 안전 점검","related_keywords":["한파 대비","난방 안전","안전 점검"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"data-report-reading-guide","title":"돌봄로봇이 보내는 데이터, 어떻게 읽어야 하나","subtitle":"생활 패턴 리포트와 알림 기록을 보호자가 해석하는 방법","main_keyword":"돌봄 데이터 해석","related_keywords":["생활 리포트","알림 기록","데이터 읽기"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"social-worker-onboarding-multiple","title":"여러 가구에 돌봄로봇 보급할 때, 현장 운영 노하우","subtitle":"사회복지사가 다수 가구 설치·관리를 효율화하는 실무 가이드","main_keyword":"다가구 돌봄로봇 운영","related_keywords":["현장 설치","가구 관리","복지사 실무"],"category":"guide","target_persona":"social_worker"},
  {"slug":"welfare-center-program-design","title":"복지관 어르신 프로그램에 돌봄로봇 녹이는 법","subtitle":"그룹 활동과 인지 건강 지원 프로그램에 로봇을 접목하는 설계","main_keyword":"복지관 로봇 프로그램","related_keywords":["그룹 활동","프로그램 설계","기관 활용"],"category":"guide","target_persona":"institution"},
  {"slug":"factory-reset-and-handover","title":"돌봄로봇 반납·교체 전, 데이터 초기화하는 법","subtitle":"개인정보를 안전하게 지우고 기기를 반납·이관하는 절차","main_keyword":"돌봄로봇 초기화","related_keywords":["데이터 삭제","기기 반납","정보 보호"],"category":"guide","target_persona":"all"},
  {"slug":"elderly-living-alone-mom-checklist","title":"혼자 계신 어머니, 안심하려면 무엇을 챙겨야 할까","subtitle":"독거 어머니의 안전·안부를 돌봄로봇으로 점검하는 항목 정리","main_keyword":"독거 어머니 돌봄","related_keywords":["안부 점검","독거 안전","어머니 돌봄"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"first-time-buyer-faq","title":"돌봄로봇 처음 알아보는 분들이 가장 많이 묻는 것","subtitle":"구매·비용·기능에 대한 초보자 자주 묻는 질문 모음","main_keyword":"돌봄로봇 자주 묻는 질문","related_keywords":["초보자 가이드","구매 질문","기능 문의"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"comparing-features-checklist-template","title":"돌봄로봇 비교표 직접 만들기, 항목 체크리스트","subtitle":"여러 모델을 객관적으로 비교하는 평가 항목과 점수표 양식","main_keyword":"돌봄로봇 비교표","related_keywords":["평가 항목","점수표","객관 비교"],"category":"guide","target_persona":"all"},
  {"slug":"voice-command-cheat-sheet","title":"어르신이 자주 쓰는 말 한마디, 돌봄로봇 음성 명령 정리","subtitle":"헷갈리지 않게 정리한 돌봄로봇 음성 명령어와 호출법 가이드","main_keyword":"돌봄로봇 음성 명령어","related_keywords":["호출 방법","명령어 정리","음성 사용법"],"category":"guide","target_persona":"family_caregiver"},
  {"slug":"software-update-guide","title":"돌봄로봇 소프트웨어 업데이트, 꼭 해야 할까","subtitle":"기능 개선과 보안을 위한 펌웨어 업데이트 확인·적용 방법","main_keyword":"돌봄로봇 업데이트","related_keywords":["펌웨어 업데이트","기능 개선","보안 점검"],"category":"guide","target_persona":"all"},
  {"slug":"aging-population-2030-forecast","title":"2030년 초고령사회, 돌봄로봇 수요는 어디까지 갈까","subtitle":"고령 인구 전망과 돌봄 인력 부족이 만드는 로봇 수요 분석","main_keyword":"초고령사회 돌봄로봇","related_keywords":["고령 인구 전망","돌봄 인력 부족","수요 전망"],"category":"news","target_persona":"all"},
  {"slug":"government-budget-2026-care-robot","title":"2026년 돌봄로봇 예산, 정부는 얼마를 풀었나","subtitle":"올해 돌봄로봇 보급 관련 정부 예산 규모와 배분 방향","main_keyword":"2026 돌봄로봇 예산","related_keywords":["정부 예산","보급 예산","예산 배분"],"category":"news","target_persona":"public_servant"},
  {"slug":"care-worker-shortage-statistics","title":"요양보호사가 부족하다, 숫자로 본 돌봄 공백","subtitle":"요양 인력 수급 통계로 살펴본 돌봄로봇 도입 필요성","main_keyword":"요양보호사 부족","related_keywords":["돌봄 인력","수급 통계","돌봄 공백"],"category":"news","target_persona":"all"},
  {"slug":"global-care-robot-market-trend","title":"세계 돌봄로봇 시장, 일본·유럽은 어디까지 왔나","subtitle":"해외 주요국 돌봄로봇 보급 현황과 한국과의 격차 비교","main_keyword":"세계 돌봄로봇 시장","related_keywords":["일본 돌봄로봇","유럽 사례","해외 동향"],"category":"news","target_persona":"all"},
  {"slug":"solo-death-statistics-2026","title":"고독사 통계 2026, 돌봄 기술은 어떤 답을 줄까","subtitle":"최신 고독사 현황 데이터와 안부 확인 기술의 역할 분석","main_keyword":"고독사 통계 2026","related_keywords":["고독사 현황","안부 확인 기술","사회 안전망"],"category":"news","target_persona":"public_servant"},
  {"slug":"new-pilot-cities-2026","title":"올해 돌봄로봇 시범도시로 선정된 곳은 어디","subtitle":"2026년 돌봄로봇 시범 보급에 나선 지자체와 운영 방식 정리","main_keyword":"돌봄로봇 시범도시","related_keywords":["시범 사업","선정 지자체","운영 방식"],"category":"news","target_persona":"public_servant"},
  {"slug":"ai-tech-advances-care-robot","title":"생성형 AI가 돌봄로봇을 어떻게 바꾸고 있나","subtitle":"대화 모델 발전이 돌봄로봇 음성·정서 기능에 미친 변화","main_keyword":"AI 돌봄로봇 트렌드","related_keywords":["생성형 AI","대화 모델","기술 발전"],"category":"news","target_persona":"all"},
  {"slug":"regional-budget-gap-analysis","title":"사는 지역 따라 갈리는 돌봄로봇, 예산 격차 들여다보기","subtitle":"지자체별 돌봄로봇 보급 예산 차이와 수혜 격차 분석","main_keyword":"지역 돌봄로봇 격차","related_keywords":["지자체 예산","보급 격차","지역 불균형"],"category":"news","target_persona":"public_servant"},
  {"slug":"care-robot-safety-standards","title":"돌봄로봇 안전 기준, 어떤 인증을 봐야 하나","subtitle":"국내 돌봄로봇 안전·품질 인증 제도와 표시 의무 정리","main_keyword":"돌봄로봇 안전 인증","related_keywords":["품질 인증","안전 기준","인증 표시"],"category":"news","target_persona":"all"},
  {"slug":"robot-effectiveness-field-data","title":"현장 데이터로 본 돌봄로봇, 정말 효과가 있었나","subtitle":"지자체 보급 사업의 운영 데이터로 살펴본 활용 성과","main_keyword":"돌봄로봇 효과 데이터","related_keywords":["운영 성과","현장 데이터","보급 효과"],"category":"news","target_persona":"public_servant"},
  {"slug":"digital-divide-elderly-tech","title":"디지털 격차 시대, 어르신은 돌봄 기술을 받아들일까","subtitle":"고령층 디지털 적응 통계로 본 돌봄로봇 수용성 전망","main_keyword":"고령층 디지털 격차","related_keywords":["디지털 적응","기술 수용성","고령층 통계"],"category":"news","target_persona":"all"},
  {"slug":"industry-key-players-2026","title":"돌봄로봇 시장을 이끄는 기업들, 지금 어디쯤 왔나","subtitle":"국내 주요 돌봄로봇 제조사 동향과 신제품 출시 흐름 정리","main_keyword":"돌봄로봇 제조사 동향","related_keywords":["주요 기업","신제품 출시","산업 동향"],"category":"news","target_persona":"all"},
  {"slug":"privacy-regulation-changes","title":"돌봄로봇 개인정보 규제, 올해 무엇이 달라지나","subtitle":"영상·음성 데이터 수집 관련 제도 변화와 사업자 의무 정리","main_keyword":"돌봄로봇 개인정보 규제","related_keywords":["데이터 규제","사업자 의무","제도 변화"],"category":"news","target_persona":"all"},
  {"slug":"smart-care-village-projects","title":"스마트 돌봄마을, 동네 전체가 어르신을 살핀다","subtitle":"지역 단위 스마트 돌봄 인프라 구축 사례와 돌봄로봇의 역할","main_keyword":"스마트 돌봄마을","related_keywords":["지역 돌봄 인프라","스마트 케어","마을 단위 사업"],"category":"news","target_persona":"public_servant"},
  {"slug":"care-robot-research-2026-summary","title":"2026년 돌봄로봇 연구, 새로 밝혀진 것들","subtitle":"올해 발표된 국내외 돌봄로봇 연구 결과를 알기 쉽게 요약","main_keyword":"돌봄로봇 연구 2026","related_keywords":["연구 결과","최신 논문","효과 검증"],"category":"news","target_persona":"all"},
  {"slug":"rural-aging-and-robot-role","title":"텅 비어가는 농촌, 돌봄로봇이 메울 수 있을까","subtitle":"농촌 고령화 통계로 본 돌봄로봇 보급의 의미와 과제","main_keyword":"농촌 고령화 돌봄로봇","related_keywords":["농촌 고령화","지역 소멸","돌봄 공백"],"category":"news","target_persona":"public_servant"},
  {"slug":"insurance-coverage-policy-outlook","title":"돌봄로봇도 복지용구가 될까, 제도 편입 전망","subtitle":"돌봄로봇의 복지용구·급여 항목 편입 논의와 향후 전망","main_keyword":"돌봄로봇 복지용구 편입","related_keywords":["급여 항목","제도 편입","복지용구 등재"],"category":"news","target_persona":"public_servant"},
  {"slug":"public-perception-survey-results","title":"사람들은 돌봄로봇을 어떻게 볼까, 인식 조사 결과","subtitle":"국민 인식 조사로 본 돌봄로봇 수용 태도와 우려 지점","main_keyword":"돌봄로봇 인식 조사","related_keywords":["국민 인식","수용 태도","여론 조사"],"category":"news","target_persona":"all"},
  {"slug":"care-robot-export-opportunity","title":"K-돌봄로봇, 해외로 나갈 수 있을까","subtitle":"국산 돌봄로봇의 수출 가능성과 해외 진출 사례 분석","main_keyword":"돌봄로봇 수출","related_keywords":["해외 진출","K-로봇","수출 전망"],"category":"news","target_persona":"all"},
  {"slug":"next-gen-care-robot-features","title":"다음 세대 돌봄로봇, 어떤 기능이 추가될까","subtitle":"개발 중인 차세대 돌봄로봇 기술과 예상 기능 전망","main_keyword":"차세대 돌봄로봇","related_keywords":["미래 기능","기술 로드맵","신기능 전망"],"category":"news","target_persona":"all"}
]

const startIndex = args?.startIndex ?? 0
const count = args?.count ?? ALL_TOPICS.length
const topics = ALL_TOPICS.slice(startIndex, startIndex + count)

if (topics.length === 0) {
  log('처리할 토픽이 없습니다.')
  return { error: 'no topics', results: [] }
}

log(`블로그 ${topics.length}개 생성 시작 (인덱스 ${startIndex}~${startIndex + topics.length - 1})`)

// ─────────────────────────────────────────
// 스키마
// ─────────────────────────────────────────
const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    facts: {
      type: 'array',
      description: '1차 데이터 (definition/statistic/process/faq/comparison), 최소 5건',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['definition', 'statistic', 'process', 'faq', 'comparison'] },
          content: { type: 'string', description: '사실 내용 (한국어)' },
          source: { type: 'string', description: '출처 (보건복지부/KIRIA/통계청/복지로/제조사 공식 등 공공·공식)' },
        },
        required: ['kind', 'content', 'source'],
      },
    },
    key_concepts: { type: 'array', items: { type: 'string' }, description: '핵심 개념 3~5개' },
  },
  required: ['facts', 'key_concepts'],
}

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    body_md: { type: 'string', description: '마크다운 본문 (3000~4500자, # ## ### 헤딩 5~7개 + 콜아웃(:::key/:::tip/:::warn) + 표 + 리스트 + 체크리스트 + > 인용 + [링크], 2026년 5월 최신 기준)' },
    summary: { type: 'string', description: 'AnswerBlock용 요약 (250자 이내, 핵심 답변)' },
    tags: { type: 'array', items: { type: 'string' }, description: '태그 3~5개' },
    reading_time_minutes: { type: 'integer' },
    macro: { type: 'string', description: '사용한 매크로 (A~G)' },
    used_facts_count: { type: 'integer', description: '본문에 인용한 1차 데이터 건수' },
  },
  required: ['body_md', 'summary', 'tags', 'reading_time_minutes'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    quality_score: { type: 'integer', description: '품질 점수 0~100 (8차원 합)' },
    medical_violations: { type: 'array', items: { type: 'string' }, description: '의료표현 위반 단어 목록 (없으면 빈 배열)' },
    cliche_violations: { type: 'array', items: { type: 'string' }, description: '클리셰 위반 목록' },
    ai_disclosure_found: { type: 'boolean', description: 'AI 작성 고지 발견 여부' },
    pass: { type: 'boolean', description: '발행 가능 여부 (품질>=90 AND 위반 0건)' },
    weak_points: { type: 'string', description: '90점 미만 시 약점 (수정 지침)' },
  },
  required: ['quality_score', 'medical_violations', 'cliche_violations', 'ai_disclosure_found', 'pass'],
}

// ─────────────────────────────────────────
// 프롬프트 빌더
// ─────────────────────────────────────────
const FORBIDDEN_MEDICAL = '치매 예방, 치매 치료, 처방, 의료기기, 환자, 진단, 효능, 약효, 치료 효과'
const ALLOWED_TERMS = '인지 건강 지원, 보조, 맞춤 안내, 복지용구, 어르신, 상태 확인, 기능'

function researchPrompt(t) {
  return `당신은 돌봄지기(어르신 돌봄로봇 정보 사이트)의 리서처입니다. P1 큐레이터 페르소나 — 자격 주장 없이 1차 자료를 정리합니다.

글 제목: "${t.title}"
부제목: "${t.subtitle}"
메인 키워드: ${t.main_keyword}
연관 키워드: ${(t.related_keywords || []).join(', ')}

이 글에 쓸 1차 데이터를 추출하세요:
1. 핵심 개념 3~5개 분해
2. 다음 5종 사실을 최소 5건 (가능하면 각 종류 1건 이상):
   - definition: 공식 정의
   - statistic: 출처 있는 수치 (한국 고령자/돌봄로봇 관련, 통계청·보건복지부·KIRIA)
   - process: 신청·이용 절차 (복지로·지자체 공식)
   - faq: 공식 Q&A
   - comparison: 비교 데이터

출처는 보건복지부, KIRIA(한국로봇산업진흥원), 통계청, 복지로, 제조사 공식 등 공공·공식 자료여야 합니다.
실제로 알려진 신뢰 가능한 사실만 쓰세요. 수치는 합리적 범위에서. 허위 통계 금지.

**의료 표현 절대 금지**: ${FORBIDDEN_MEDICAL} → 대신 ${ALLOWED_TERMS} 사용.`
}

function writePrompt(t, research, revisionNote) {
  // 제목 길이로 결정적 매크로 선택
  const macros = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const macroIdx = t.title.length % 7
  const macro = macros[macroIdx]
  const macroDesc = {
    A: '종합 가이드 (H2 5~7개, 전체 개관, 요약 결말)',
    B: 'Q&A 즉답 (질문 훅으로 시작, H2 4~5개, 행동 결말)',
    C: '통계 리드 (수치로 시작, H2 4~6개, 전망 결말)',
    D: '일화→원칙 (구체 장면으로 시작, H2 4~6개)',
    E: '비교표 (2~5개 비교, 표 필수, H2 4~5개)',
    F: 'How-To 단계 (절차 단계별, H2 4~6개, 번호 리스트)',
    G: '큐레이션 리스트 (항목 선별, H2 5~7개)',
  }[macro]

  return `당신은 돌봄지기의 라이터입니다. P1 큐레이터 — 1차 자료를 친절히 정리하되 자격 주장·권유는 하지 않습니다. 현재 시점은 2026년 5월입니다.

글 제목: "${t.title}"
부제목: "${t.subtitle}"
타겟 독자: ${t.target_persona}
메인 키워드: ${t.main_keyword} (제목·첫 문단에 자연스럽게 포함, 남발 금지)
연관 키워드: ${(t.related_keywords || []).join(', ')} (본문에 자연스럽게 분산)

매크로 골격: ${macro} — ${macroDesc}

리서치 데이터(이것을 본문에 최소 4건 인용):
${JSON.stringify(research.facts, null, 2)}
핵심 개념: ${(research.key_concepts || []).join(', ')}

**작성 규칙 (가독성·정보밀도 강화):**
- 마크다운만 사용. 지원 문법:
  - # (대제목 h2), ## (중제목 h3), ### (소제목)
  - 표 \`| 항목 | 값 |\`, 리스트 \`- \`, 번호 \`1. \`
  - 체크리스트 \`- [ ] 항목\` / \`- [x] 완료항목\` (구매·점검·준비물에 활용)
  - 인용 \`> \`, **굵게**, [링크](url)
  - **콜아웃 박스 (적극 활용)**:
    - 핵심 요약: \`:::key\` 줄 → 내용 → \`:::\` 줄 (글마다 1개, 도입부 핵심 답변)
    - 도움말: \`:::tip\` → 내용 → \`:::\` (실용 팁)
    - 주의: \`:::warn\` → 내용 → \`:::\` (한계·주의사항, 의료표현 회피 고지)
- **분량 3000~4500자**, H2(# ) 헤딩 5~7개 — 각 섹션을 구체 사례·수치·절차로 충실히
- **시각 요소 의무**: \`:::key\` 1개 + (\`:::tip\` 또는 \`:::warn\`) 1~2개 + 표 1개 이상 + 리스트 1개 이상
- 1차 데이터 4건 이상 인용하며 출처 명시 (예: "통계청 2024 고령자 통계에 따르면...")
- **최신성**: "2026년 5월 기준" 같은 시점 명시. 통계는 최신 자료(통계청 2024 고령자통계·2025 장래인구추계, KIRIA 최신 보고서, 보건복지부 2025 자료) 기준. 막연히 "최근"만 쓰지 말 것. 가격·신청 정보엔 "확인일: 2026-05-30" 표기
- 내부링크 3~4개: [돌봄로봇 제품](/robot), [지원사업 안내](/support), [이용 가이드](/guide), [제품 비교](/compare)
- 첫 문단(훅): 매크로에 맞게(질문/통계/장면/대비). "안녕하세요" 류 클리셰 금지
- 결말: 요약 또는 다음 행동 안내. "이상으로 마치겠습니다" 류 금지
- summary: AnswerBlock용 250자 이내 핵심 답변 (별도 필드)

**절대 금지:**
- 의료 표현: ${FORBIDDEN_MEDICAL} → 대신 ${ALLOWED_TERMS}
- "이 글은 AI가 작성" 류 AI 고지 일절 금지
- 자격 사칭 ("전문가로서", "의사로서" 등) 금지
- 허위 통계·없는 출처 금지
${revisionNote ? `\n**수정 지침 (이전 평가 반영):** ${revisionNote}` : ''}`
}

function editPrompt(t, draft) {
  return `당신은 돌봄지기의 에디터입니다. 다음 블로그 초안을 엄격히 평가하세요.

제목: "${t.title}"
본문(마크다운):
${draft.body_md}

요약: ${draft.summary}

**평가 항목 (8차원 100점):**
- 독창성 15 / 1차데이터 인용(4건+·출처·최신성) 20 / 구조·가독성 15 / 시각요소(콜아웃·표·리스트·체크리스트) 15 / 페르소나(P1) 10 / AEO 10 / 내부링크·본문리듬 10 / 검색의도 5
- 시각요소 항목: \`:::key\` 1개 + (tip 또는 warn) 1개+ + 표 1개+ + 리스트 1개+ 없으면 감점
- 최신성: "2026년 5월 기준" 등 시점·최신 통계 출처 없으면 1차데이터 점수 감점
- 분량 3000자 미만이면 구조·가독성 감점

**위반 검사 (하나라도 있으면 pass=false):**
1. 의료 표현: ${FORBIDDEN_MEDICAL} — 본문에서 정확히 찾아 medical_violations에 나열
2. 클리셰: "안녕하세요 여러분", "이상으로", "오늘은 ~에 대해 알아보겠습니다" 등
3. AI 작성 고지 ("AI가 작성", "인공지능이 생성" 등)
4. 자격 사칭

**pass 기준**: quality_score >= 90 AND medical_violations 0건 AND cliche_violations 0건 AND ai_disclosure_found=false

90점 미만이거나 위반이 있으면 weak_points에 구체적 수정 지침을 쓰세요.`
}

// ─────────────────────────────────────────
// 파이프라인: 각 글 = Research → Write → Edit (revision 루프)
// ─────────────────────────────────────────
const results = await pipeline(
  topics,
  // Stage 1: Research
  (t) => agent(researchPrompt(t), { label: `research:${t.slug}`, phase: 'Research', schema: RESEARCH_SCHEMA })
    .then((research) => ({ t, research })),

  // Stage 2: Write + Edit (revision 최대 2회)
  async ({ t, research }) => {
    let draft = await agent(writePrompt(t, research), { label: `write:${t.slug}`, phase: 'Write', schema: DRAFT_SCHEMA })
    let verdict = await agent(editPrompt(t, draft), { label: `edit:${t.slug}`, phase: 'Edit', schema: VERDICT_SCHEMA })

    let revisions = 0
    while (!verdict.pass && revisions < 2) {
      revisions++
      const note = `품질 ${verdict.quality_score}점. 의료위반:[${verdict.medical_violations.join(',')}] 클리셰:[${verdict.cliche_violations.join(',')}] 약점: ${verdict.weak_points || ''}`
      draft = await agent(writePrompt(t, research, note), { label: `rewrite${revisions}:${t.slug}`, phase: 'Write', schema: DRAFT_SCHEMA })
      verdict = await agent(editPrompt(t, draft), { label: `re-edit${revisions}:${t.slug}`, phase: 'Edit', schema: VERDICT_SCHEMA })
    }

    return {
      slug: t.slug,
      title: t.title,
      subtitle: t.subtitle,
      summary: draft.summary,
      body_md: draft.body_md,
      category: t.category,
      target_persona: t.target_persona,
      tags: draft.tags,
      reading_time_minutes: draft.reading_time_minutes,
      quality_score: verdict.quality_score,
      pass: verdict.pass,
      medical_violations: verdict.medical_violations,
      revisions,
    }
  }
)

const valid = results.filter(Boolean)
const passed = valid.filter((r) => r.pass)
log(`완료: ${valid.length}개 생성, ${passed.length}개 품질 통과 (90점+, 위반0)`)

return {
  total: topics.length,
  generated: valid.length,
  passed: passed.length,
  results: valid,
}
