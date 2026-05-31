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

  // ─── 서울 추가 ──────────────────────────
  {
    sido_code: '11', sigungu_code: '350',
    sido_name: '서울특별시', sigungu_name: '노원구',
    level: 'sigungu', slug: 'seoul-nowon-gu',
    population_65plus: 61_000, single_elderly_households: 19_000,
  },
  {
    sido_code: '11', sigungu_code: '710',
    sido_name: '서울특별시', sigungu_name: '송파구',
    level: 'sigungu', slug: 'seoul-songpa-gu',
    population_65plus: 74_000, single_elderly_households: 22_000,
  },
  {
    sido_code: '11', sigungu_code: '500',
    sido_name: '서울특별시', sigungu_name: '강서구',
    level: 'sigungu', slug: 'seoul-gangseo-gu',
    population_65plus: 66_000, single_elderly_households: 20_000,
  },
  {
    sido_code: '11', sigungu_code: '440',
    sido_name: '서울특별시', sigungu_name: '마포구',
    level: 'sigungu', slug: 'seoul-mapo-gu',
    population_65plus: 36_000, single_elderly_households: 12_000,
  },

  // ─── 경기 추가 ──────────────────────────
  {
    sido_code: '41', sigungu_code: '131',
    sido_name: '경기도', sigungu_name: '성남시',
    level: 'sigungu', slug: 'gyeonggi-seongnam',
    population_65plus: 92_000, single_elderly_households: 24_000,
  },
  {
    sido_code: '41', sigungu_code: '461',
    sido_name: '경기도', sigungu_name: '용인시',
    level: 'sigungu', slug: 'gyeonggi-yongin',
    population_65plus: 87_000, single_elderly_households: 22_000,
  },
  {
    sido_code: '41', sigungu_code: '190',
    sido_name: '경기도', sigungu_name: '부천시',
    level: 'sigungu', slug: 'gyeonggi-bucheon',
    population_65plus: 71_000, single_elderly_households: 18_500,
  },
  {
    sido_code: '41', sigungu_code: '360',
    sido_name: '경기도', sigungu_name: '남양주시',
    level: 'sigungu', slug: 'gyeonggi-namyangju',
    population_65plus: 56_000, single_elderly_households: 14_000,
  },

  // ─── 대전 ───────────────────────────────
  {
    sido_code: '30', sigungu_code: '170',
    sido_name: '대전광역시', sigungu_name: '서구',
    level: 'sigungu', slug: 'daejeon-seo-gu',
    population_65plus: 48_000, single_elderly_households: 13_500,
  },
  {
    sido_code: '30', sigungu_code: '200',
    sido_name: '대전광역시', sigungu_name: '유성구',
    level: 'sigungu', slug: 'daejeon-yuseong-gu',
    population_65plus: 32_000, single_elderly_households: 9_000,
  },

  // ─── 대구 추가 ──────────────────────────
  {
    sido_code: '27', sigungu_code: '260',
    sido_name: '대구광역시', sigungu_name: '수성구',
    level: 'sigungu', slug: 'daegu-suseong-gu',
    population_65plus: 57_000, single_elderly_households: 16_000,
  },

  // ─── 울산 ───────────────────────────────
  {
    sido_code: '31', sigungu_code: '140',
    sido_name: '울산광역시', sigungu_name: '남구',
    level: 'sigungu', slug: 'ulsan-nam-gu',
    population_65plus: 43_000, single_elderly_households: 11_000,
  },

  // ─── 경상남도 ────────────────────────────
  {
    sido_code: '48', sigungu_code: '121',
    sido_name: '경상남도', sigungu_name: '창원시',
    level: 'sigungu', slug: 'gyeongnam-changwon',
    population_65plus: 112_000, single_elderly_households: 30_000,
  },

  // ─── 경상북도 ────────────────────────────
  {
    sido_code: '47', sigungu_code: '111',
    sido_name: '경상북도', sigungu_name: '포항시',
    level: 'sigungu', slug: 'gyeongbuk-pohang',
    population_65plus: 82_000, single_elderly_households: 22_000,
  },

  // ─── 전라북도 ────────────────────────────
  {
    sido_code: '45', sigungu_code: '111',
    sido_name: '전라북도', sigungu_name: '전주시',
    level: 'sigungu', slug: 'jeonbuk-jeonju',
    population_65plus: 91_000, single_elderly_households: 26_000,
  },

  // ─── 충청남도 ────────────────────────────
  {
    sido_code: '44', sigungu_code: '131',
    sido_name: '충청남도', sigungu_name: '천안시',
    level: 'sigungu', slug: 'chungnam-cheonan',
    population_65plus: 78_000, single_elderly_households: 20_000,
  },

  // ─── 충청북도 ────────────────────────────
  {
    sido_code: '43', sigungu_code: '111',
    sido_name: '충청북도', sigungu_name: '청주시',
    level: 'sigungu', slug: 'chungbuk-cheongju',
    population_65plus: 88_000, single_elderly_households: 24_000,
  },

  // ─── 전라남도 ────────────────────────────
  {
    sido_code: '46', sigungu_code: '750',
    sido_name: '전라남도', sigungu_name: '순천시',
    level: 'sigungu', slug: 'jeonnam-suncheon',
    population_65plus: 42_000, single_elderly_households: 13_000,
  },

  // ─── 제주 ───────────────────────────────
  {
    sido_code: '50', sigungu_code: '110',
    sido_name: '제주특별자치도', sigungu_name: '제주시',
    level: 'sigungu', slug: 'jeju-jeju-si',
    population_65plus: 58_000, single_elderly_households: 17_000,
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
    name_ko: '종로구 어르신 돌봄로봇 보급사업',
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
    name_ko: '수원시 어르신 돌봄로봇 보급사업',
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
    name_ko: '남동구 어르신 AI 돌봄로봇 무상 배포',
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
    name_ko: '달서구 독거노인 돌봄로봇 보급',
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
    name_ko: '광주 북구 어르신 돌봄로봇 배포사업',
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

  // ─── 서울 추가 지원사업 ──────────────────
  {
    regionSlug: 'seoul-nowon-gu',
    slug: 'nowon-2024-care-robot',
    name_ko: '노원구 독거어르신 AI 돌봄로봇 지원',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '서울 노원구 주민등록 거주' },
      { category: '가구', requirement: '독거 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층 우선' },
    ]),
    application_method: '노원구청 노인복지과 방문 신청;노원구 복지관 연계 신청',
    application_url: 'https://www.nowon.go.kr',
    distribution_count: 58,
    source_url: 'https://www.nowon.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'seoul-songpa-gu',
    slug: 'songpa-2024-senior-robot',
    name_ko: '송파구 스마트 어르신 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '서울 송파구 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '송파구청 복지정책과 방문 신청',
    application_url: 'https://www.songpa.go.kr',
    distribution_count: 70,
    source_url: 'https://www.songpa.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'seoul-gangseo-gu',
    slug: 'gangseo-2024-care-robot',
    name_ko: '강서구 어르신 돌봄로봇 배포사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '서울 강서구 거주' },
      { category: '가구', requirement: '독거노인 우선 배정' },
      { category: '소득', requirement: '기초생활수급자, 취약계층' },
    ]),
    application_method: '강서구청 노인복지과 방문 신청;동 주민센터 추천 가능',
    application_url: 'https://www.gangseo.seoul.kr',
    distribution_count: 63,
    source_url: 'https://www.gangseo.seoul.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'seoul-mapo-gu',
    slug: 'mapo-2024-robot-support',
    name_ko: '마포구 AI 돌봄로봇 무상 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '서울 마포구 거주' },
      { category: '소득', requirement: '기초수급자 우선' },
    ]),
    application_method: '마포구청 복지정책과 방문 신청',
    application_url: 'https://www.mapo.go.kr',
    distribution_count: 35,
    source_url: 'https://www.mapo.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 경기 추가 지원사업 ──────────────────
  {
    regionSlug: 'gyeonggi-seongnam',
    slug: 'seongnam-2024-care-robot',
    name_ko: '성남시 어르신 AI 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '성남시 수정·중원·분당구 거주' },
      { category: '가구', requirement: '독거노인, 조손 가구 우선' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층' },
    ]),
    application_method: '성남시청 복지정책과 또는 각 구청 노인복지과 방문 신청',
    application_url: 'https://www.seongnam.go.kr',
    distribution_count: 95,
    source_url: 'https://www.seongnam.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gyeonggi-yongin',
    slug: 'yongin-2024-senior-robot',
    name_ko: '용인시 독거어르신 돌봄로봇 지원사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '용인시 처인·기흥·수지구 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층 우선' },
    ]),
    application_method: '용인시청 노인복지과 방문 신청',
    application_url: 'https://www.yongin.go.kr',
    distribution_count: 88,
    source_url: 'https://www.yongin.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gyeonggi-bucheon',
    slug: 'bucheon-2024-care-robot',
    name_ko: '부천시 스마트 노인돌봄 로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '부천시 거주' },
      { category: '가구', requirement: '독거노인 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초수급자 우선 배정' },
    ]),
    application_method: '부천시청 복지국 방문 신청;부천시 노인복지관 연계 신청',
    application_url: 'https://www.bucheon.go.kr',
    distribution_count: 72,
    source_url: 'https://www.bucheon.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'gyeonggi-namyangju',
    slug: 'namyangju-2024-robot',
    name_ko: '남양주시 어르신 AI 돌봄로봇 배포사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '남양주시 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '남양주시청 사회복지과 방문 신청',
    application_url: 'https://www.namyangju.go.kr',
    distribution_count: 55,
    source_url: 'https://www.namyangju.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 대전 지원사업 ───────────────────────
  {
    regionSlug: 'daejeon-seo-gu',
    slug: 'daejeon-seo-2024-care-robot',
    name_ko: '대전 서구 어르신 돌봄로봇 지원사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '대전광역시 서구 거주' },
      { category: '가구', requirement: '독거노인 우선' },
      { category: '소득', requirement: '기초생활수급자, 차상위계층' },
    ]),
    application_method: '서구청 노인복지과 방문 신청;서구 노인복지관 연계 신청',
    application_url: 'https://www.seo.daejeon.kr',
    distribution_count: 46,
    source_url: 'https://www.seo.daejeon.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
  {
    regionSlug: 'daejeon-yuseong-gu',
    slug: 'yuseong-2024-robot-support',
    name_ko: '유성구 AI 어르신 돌봄로봇 보급',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '대전 유성구 거주' },
      { category: '소득', requirement: '기초수급자 우선' },
    ]),
    application_method: '유성구청 복지정책과 방문 신청',
    application_url: 'https://www.yuseong.daejeon.kr',
    distribution_count: 30,
    source_url: 'https://www.yuseong.daejeon.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 대구 추가 지원사업 ──────────────────
  {
    regionSlug: 'daegu-suseong-gu',
    slug: 'suseong-2024-care-robot',
    name_ko: '수성구 독거노인 AI 돌봄로봇 보급',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '대구 수성구 거주' },
      { category: '가구', requirement: '독거노인 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '수성구청 노인복지과 방문 신청;수성구 노인복지관 추천 신청',
    application_url: 'https://www.suseong.kr',
    distribution_count: 58,
    source_url: 'https://www.suseong.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 울산 지원사업 ───────────────────────
  {
    regionSlug: 'ulsan-nam-gu',
    slug: 'ulsan-nam-2024-robot',
    name_ko: '울산 남구 어르신 돌봄로봇 배포사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '울산광역시 남구 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층 우선' },
    ]),
    application_method: '남구청 복지지원과 방문 신청',
    application_url: 'https://www.ulsannamgu.go.kr',
    distribution_count: 42,
    source_url: 'https://www.ulsannamgu.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 경남 지원사업 ───────────────────────
  {
    regionSlug: 'gyeongnam-changwon',
    slug: 'changwon-2024-care-robot',
    name_ko: '창원시 어르신 AI 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '창원시 5개 구 거주' },
      { category: '가구', requirement: '독거노인, 조손 가구 우선' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '창원시청 노인복지과 방문 신청;각 구청 복지과 연계 신청',
    application_url: 'https://www.changwon.go.kr',
    distribution_count: 115,
    source_url: 'https://www.changwon.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 경북 지원사업 ───────────────────────
  {
    regionSlug: 'gyeongbuk-pohang',
    slug: 'pohang-2024-senior-robot',
    name_ko: '포항시 독거어르신 돌봄로봇 지원사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '포항시 남·북구 거주' },
      { category: '가구', requirement: '독거노인 우선' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '포항시청 복지지원과 방문 신청;포항시 노인복지관 연계 신청',
    application_url: 'https://www.pohang.go.kr',
    distribution_count: 83,
    source_url: 'https://www.pohang.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 전북 지원사업 ───────────────────────
  {
    regionSlug: 'jeonbuk-jeonju',
    slug: 'jeonju-2024-care-robot',
    name_ko: '전주시 어르신 AI 돌봄로봇 무상 배포',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '전주시 완산구·덕진구 거주' },
      { category: '가구', requirement: '독거노인 또는 노인 부부 가구' },
      { category: '소득', requirement: '기초수급자, 차상위계층 우선' },
    ]),
    application_method: '전주시청 노인복지과 방문 신청;동 행정복지센터 연계 신청',
    application_url: 'https://www.jeonju.go.kr',
    distribution_count: 92,
    source_url: 'https://www.jeonju.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 충남 지원사업 ───────────────────────
  {
    regionSlug: 'chungnam-cheonan',
    slug: 'cheonan-2024-robot-support',
    name_ko: '천안시 스마트 노인돌봄 로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '천안시 동남구·서북구 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층 우선' },
    ]),
    application_method: '천안시청 복지정책과 방문 신청',
    application_url: 'https://www.cheonan.go.kr',
    distribution_count: 78,
    source_url: 'https://www.cheonan.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 충북 지원사업 ───────────────────────
  {
    regionSlug: 'chungbuk-cheongju',
    slug: 'cheongju-2024-care-robot',
    name_ko: '청주시 어르신 AI 돌봄로봇 지원',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '청주시 4개 구 거주' },
      { category: '가구', requirement: '독거노인 우선 배정' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '청주시청 노인복지과 방문 신청;각 구청 복지과 연계 신청',
    application_url: 'https://www.cheongju.go.kr',
    distribution_count: 89,
    source_url: 'https://www.cheongju.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 전남 지원사업 ───────────────────────
  {
    regionSlug: 'jeonnam-suncheon',
    slug: 'suncheon-2024-robot',
    name_ko: '순천시 어르신 돌봄로봇 보급사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상' },
      { category: '거주지', requirement: '순천시 거주' },
      { category: '가구', requirement: '독거노인 우선' },
      { category: '소득', requirement: '기초수급자, 차상위계층' },
    ]),
    application_method: '순천시청 복지국 방문 신청;순천시 노인복지관 연계 신청',
    application_url: 'https://www.suncheon.go.kr',
    distribution_count: 41,
    source_url: 'https://www.suncheon.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },

  // ─── 제주 지원사업 ───────────────────────
  {
    regionSlug: 'jeju-jeju-si',
    slug: 'jeju-si-2024-care-robot',
    name_ko: '제주시 어르신 AI 돌봄로봇 배포사업',
    program_type: 'free_distribution',
    eligibility_json: JSON.stringify([
      { category: '연령', requirement: '만 65세 이상 독거 어르신' },
      { category: '거주지', requirement: '제주특별자치도 제주시 거주' },
      { category: '소득', requirement: '기초수급자, 차상위계층 우선' },
    ]),
    application_method: '제주시청 복지정책과 방문 신청;읍면동 주민센터 연계 신청',
    application_url: 'https://www.jejusi.go.kr',
    distribution_count: 57,
    source_url: 'https://www.jejusi.go.kr/welfare',
    source_license: '공공누리 제1유형',
    status: 'active',
  },
];
