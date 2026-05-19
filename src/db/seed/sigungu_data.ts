import type { NewRegion } from '../schema';

// 시군구 지역 데이터 (sido_code 기준으로 sido와 연결)
export const sigunguRegionsSeedData: Omit<NewRegion, 'id'>[] = [
  // ─── 서울 ───────────────────────────────
  {
    sido_code: '11', sigungu_code: '110',
    sido_name: '서울특별시', sigungu_name: '종로구',
    level: 'sigungu', slug: 'seoul-jongno-gu',
    population_65plus: 28_000, single_elderly_households: 9_200,
  },
  {
    sido_code: '11', sigungu_code: '680',
    sido_name: '서울특별시', sigungu_name: '강남구',
    level: 'sigungu', slug: 'seoul-gangnam-gu',
    population_65plus: 62_000, single_elderly_households: 18_000,
  },
  {
    sido_code: '11', sigungu_code: '200',
    sido_name: '서울특별시', sigungu_name: '성동구',
    level: 'sigungu', slug: 'seoul-seongdong-gu',
    population_65plus: 38_000, single_elderly_households: 12_000,
  },
  // ─── 부산 ───────────────────────────────
  {
    sido_code: '26', sigungu_code: '350',
    sido_name: '부산광역시', sigungu_name: '해운대구',
    level: 'sigungu', slug: 'busan-haeundae-gu',
    population_65plus: 55_000, single_elderly_households: 15_000,
  },
  {
    sido_code: '26', sigungu_code: '230',
    sido_name: '부산광역시', sigungu_name: '부산진구',
    level: 'sigungu', slug: 'busan-busanjin-gu',
    population_65plus: 52_000, single_elderly_households: 14_500,
  },
  // ─── 경기 ───────────────────────────────
  {
    sido_code: '41', sigungu_code: '110',
    sido_name: '경기도', sigungu_name: '수원시',
    level: 'sigungu', slug: 'gyeonggi-suwon',
    population_65plus: 108_000, single_elderly_households: 28_000,
  },
  {
    sido_code: '41', sigungu_code: '281',
    sido_name: '경기도', sigungu_name: '고양시',
    level: 'sigungu', slug: 'gyeonggi-goyang',
    population_65plus: 105_000, single_elderly_households: 26_000,
  },
  // ─── 인천 ───────────────────────────────
  {
    sido_code: '28', sigungu_code: '245',
    sido_name: '인천광역시', sigungu_name: '남동구',
    level: 'sigungu', slug: 'incheon-namdong-gu',
    population_65plus: 46_000, single_elderly_households: 12_500,
  },
  // ─── 대구 ───────────────────────────────
  {
    sido_code: '27', sigungu_code: '290',
    sido_name: '대구광역시', sigungu_name: '달서구',
    level: 'sigungu', slug: 'daegu-dalseo-gu',
    population_65plus: 60_000, single_elderly_households: 16_000,
  },
  // ─── 광주 ───────────────────────────────
  {
    sido_code: '29', sigungu_code: '290',
    sido_name: '광주광역시', sigungu_name: '북구',
    level: 'sigungu', slug: 'gwangju-buk-gu',
    population_65plus: 42_000, single_elderly_households: 11_500,
  },
];

// 시군구 지원사업 데이터 (region_id는 seed/index.ts에서 slug로 조회)
interface SigunguProgramSeed {
  regionSlug: string;
  slug: string;
  name_ko: string;
  program_type: 'free_distribution' | 'rental' | 'subsidy' | 'rd_grant';
  eligibility_json: string;
  application_method: string;
  application_url?: string;
  distribution_count?: number;
  source_url: string;
  source_license: string;
  status: 'active' | 'closed' | 'unknown';
}

export const sigunguProgramsSeedData: SigunguProgramSeed[] = [
  {
    regionSlug: 'seoul-jongno-gu',
    slug: 'jongno-2024-senior-robot',
    name_ko: '종로구 2024년 어르신 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '서울 종로구 주민등록 주소지' },
      { category: '가구', requirement: '독거 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층 우선' },
    ]),
    application_method: '종로구청 노인복지과 방문 신청;동 주민센터 연계 신청 가능',
    application_url: 'https://www.jongno.go.kr',
    distribution_count: 45,
    source_url: 'https://www.jongno.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'seoul-gangnam-gu',
    slug: 'gangnam-2024-ai-care-robot',
    name_ko: '강남구 AI 돌봄로봇 무상 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '서울 강남구 주민등록 주소지' },
      { category: '가구', requirement: '독거노인 우선' },
      { category: '소득', requirement: '기초생활수급자, 기타 취약계층' },
    ]),
    application_method: '강남구청 복지정책과 방문 신청;강남구 노인복지관 연계 신청',
    application_url: 'https://www.gangnam.go.kr',
    distribution_count: 60,
    source_url: 'https://www.gangnam.go.kr/office/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'seoul-seongdong-gu',
    slug: 'seongdong-2024-robot-distribution',
    name_ko: '성동구 스마트 돌봄로봇 지원사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '서울 성동구 거주' },
      { category: '소득', requirement: '기초수급 및 차상위 우선' },
    ]),
    application_method: '성동구청 노인복지팀 방문 또는 전화 신청',
    application_url: 'https://www.sd.go.kr',
    distribution_count: 40,
    source_url: 'https://www.sd.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'busan-haeundae-gu',
    slug: 'haeundae-2024-care-robot',
    name_ko: '해운대구 어르신 AI 로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '부산 해운대구 주민등록 거주' },
      { category: '가구', requirement: '독거 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초생활수급자 우선 선발' },
    ]),
    application_method: '해운대구청 복지지원과 방문 신청;해운대노인복지관 추천 신청 가능',
    application_url: 'https://www.haeundae.go.kr',
    distribution_count: 55,
    source_url: 'https://www.haeundae.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'busan-busanjin-gu',
    slug: 'busanjin-2024-senior-robot',
    name_ko: '부산진구 독거노인 돌봄로봇 지원',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '부산 부산진구 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '부산진구청 노인복지과 방문 신청',
    application_url: 'https://www.busanjin.go.kr',
    distribution_count: 50,
    source_url: 'https://www.busanjin.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gyeonggi-suwon',
    slug: 'suwon-2024-care-robot',
    name_ko: '수원시 2024년 어르신 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '수원시 4개 구 거주' },
      { category: '가구', requirement: '독거노인, 조손 가구 우선' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층' },
    ]),
    application_method: '수원시 각 구청 복지과 방문 신청;수원시 노인복지관 연계 신청 가능',
    application_url: 'https://www.suwon.go.kr',
    distribution_count: 120,
    source_url: 'https://www.suwon.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gyeonggi-goyang',
    slug: 'goyang-2024-robot-program',
    name_ko: '고양시 스마트 노인돌봄 로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '고양시 덕양구·일산동구·일산서구 거주' },
      { category: '가구', requirement: '독거 어르신 우선' },
      { category: '소득', requirement: '기초생활수급자 우선 배정' },
    ]),
    application_method: '고양시청 노인복지과 신청;일산·덕양 종합사회복지관 연계 신청',
    application_url: 'https://www.goyang.go.kr',
    distribution_count: 110,
    source_url: 'https://www.goyang.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'incheon-namdong-gu',
    slug: 'namdong-2024-care-robot',
    name_ko: '남동구 2024 어르신 AI 돌봄로봇 무상 배포',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '인천 남동구 주민등록 거주' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층 우선' },
    ]),
    application_method: '남동구청 복지정책과 방문 신청;동 주민센터 연계 신청',
    application_url: 'https://www.namdong.go.kr',
    distribution_count: 48,
    source_url: 'https://www.namdong.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'daegu-dalseo-gu',
    slug: 'dalseo-2024-senior-robot',
    name_ko: '달서구 2024년 독거노인 돌봄로봇 보급',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '대구 달서구 거주' },
      { category: '가구', requirement: '독거노인 또는 노인 부부' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '달서구청 노인복지과 방문 신청;달서구 종합사회복지관 추천 가능',
    application_url: 'https://www.dalseo.go.kr',
    distribution_count: 65,
    source_url: 'https://www.dalseo.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gwangju-buk-gu',
    slug: 'bukgu-gwangju-2024-care-robot',
    name_ko: '광주 북구 2024 어르신 돌봄로봇 배포사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '광주광역시 북구 거주' },
      { category: '가구', requirement: '독거노인 우선' },
      { category: '소득', requirement: '기초생활수급자 또는 차상위계층' },
    ]),
    application_method: '북구청 복지지원과 방문 신청;북구 노인복지관 사회복지사 추천 신청',
    application_url: 'https://www.bukgu.gwangju.kr',
    distribution_count: 42,
    source_url: 'https://www.bukgu.gwangju.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
];
