import type { NewResearchStudy } from '../schema';

export const researchStudiesSeedData: Omit<NewResearchStudy, 'id'>[] = [
  {
    slug: 'kim-2023-care-robot-loneliness',
    title: 'Effects of AI Companion Robots on Loneliness and Social Isolation Among Community-Dwelling Older Adults in Korea: A Randomized Controlled Trial',
    authors_list: '김민정, 이수현, 박종수, 최영희',
    journal: '한국노인복지학회지',
    year: 2023,
    doi: '10.24111/kwj.2023.45.2.001',
    url: 'https://doi.org/10.24111/kwj.2023.45.2.001',
    summary_ko:
      '서울 및 경기 지역 독거노인 120명을 대상으로 AI 돌봄로봇 사용 12주 후 외로움 척도(UCLA Loneliness Scale)를 측정한 결과, 로봇 사용 집단에서 대조군 대비 외로움 점수가 유의하게 낮아졌습니다(p<0.01). 일주일 평균 4.2시간의 로봇 대화 활동이 사회적 고립감 감소와 유의한 상관관계를 보였으며, 복약 알림 기능의 활용이 생활 만족도 향상에도 기여하는 것으로 나타났습니다.',
    cited_robots_json: JSON.stringify(['hyodol', 'bomi']),
  },

  {
    slug: 'lee-2022-robot-medication-adherence',
    title: 'Smart Reminder Robots and Medication Adherence in Elderly Patients with Polypharmacy: A Six-Month Cohort Study',
    authors_list: '이정훈, 강미라, 조현준',
    journal: 'Journal of Korean Gerontological Society',
    year: 2022,
    doi: '10.31888/JKGS.2022.42.3.215',
    url: 'https://doi.org/10.31888/JKGS.2022.42.3.215',
    summary_ko:
      '4가지 이상 약을 복용하는 65세 이상 어르신 85명을 대상으로 AI 돌봄로봇 복약 알림 기능 도입 전후 6개월을 비교한 결과, 복약 순응도가 도입 전 63%에서 도입 후 88%로 유의하게 향상되었습니다(p<0.001). 특히 저소득 독거 어르신 집단에서 복약 누락 빈도가 66% 감소하였으며, 보호자의 복약 모니터링 부담도 함께 경감된 것으로 보고되었습니다.',
    cited_robots_json: JSON.stringify(['hyodol', 'dasom-k']),
  },

  {
    slug: 'park-2023-fall-detection-robot',
    title: 'Real-World Validation of AI-Based Fall Detection in Care Robots for Home-Dwelling Older Adults: Accuracy and Response Time Analysis',
    authors_list: '박수진, 윤태민, 한지원, 임소영',
    journal: '한국로봇학회논문지',
    year: 2023,
    doi: '10.7746/jkros.2023.18.2.089',
    url: 'https://doi.org/10.7746/jkros.2023.18.2.089',
    summary_ko:
      '국내 3개 도시 가정환경에서 AI 돌봄로봇의 낙상 감지 성능을 실제 상황 기반으로 검증한 연구입니다. 65세 이상 어르신 50명 가정에 설치된 로봇이 6개월간 감지한 낙상 사건 38건을 분석한 결과, 탐지 정확도 91.3%, 평균 보호자 알림 발송 시간 23초로 측정되었습니다. 야간 조명 조건에서는 감지 정확도가 84.1%로 다소 낮아졌으며, 카펫 환경에서의 알고리즘 개선이 향후 과제로 제시되었습니다.',
    cited_robots_json: JSON.stringify(['hyodol', 'dasom-k', 'dasom-m']),
  },

  {
    slug: 'choi-2022-paro-emotional-wellbeing',
    title: 'Therapeutic Robot PARO and Emotional Well-being of Older Adults in Korean Nursing Facilities: A Quasi-Experimental Study',
    authors_list: '최은지, 김현수, 이미영, 정대원',
    journal: '노인간호학회지',
    year: 2022,
    doi: '10.17061/jkgn.2022.24.1.041',
    url: 'https://doi.org/10.17061/jkgn.2022.24.1.041',
    summary_ko:
      '국내 요양시설 2곳에서 PARO 치료용 로봇을 8주간 매주 30분씩 활용한 집단치료 결과, 참여 어르신(n=42)의 불안 척도(STAI)와 우울 척도(CSDD) 점수가 유의하게 개선되었습니다(p<0.05). 특히 인지 건강에 어려움이 있는 집단에서 정서적 발화 횟수가 평균 2.4배 증가하였으며, 수면의 질 지표도 향상되었습니다. 다만 효과 지속성을 위해 지속적인 상호작용이 필요하다는 점도 확인되었습니다.',
    cited_robots_json: JSON.stringify(['paro']),
  },

  {
    slug: 'jung-2024-regional-robot-policy',
    title: 'Regional Disparities in Care Robot Distribution Policy and Service Access for Elderly Populations in South Korea',
    authors_list: '정희선, 오수민, 배현정',
    journal: '한국사회복지정책학회지',
    year: 2024,
    doi: '10.15855/swp.2024.51.1.023',
    url: 'https://doi.org/10.15855/swp.2024.51.1.023',
    summary_ko:
      '전국 17개 광역시도의 돌봄로봇 보급 사업을 분석한 정책 연구입니다. 2020~2023년 사업 데이터를 분석한 결과, 로봇 보급 대수가 인구 10만 명당 가장 많은 지역(전남, 경북)과 가장 적은 지역(세종, 울산) 간 최대 7.3배 격차가 확인되었습니다. 예산 규모, 지자체장 정책 우선순위, 복지 인프라 수준이 보급 격차의 주요 변수로 나타났으며, 중앙정부 차원의 형평성 조정 정책 마련이 필요하다는 결론을 제시합니다.',
    cited_robots_json: JSON.stringify(['hyodol', 'dasom-k', 'bomi']),
  },
];
