# 돌봄지기 (Dolbomjigi) — pSEO 사이트 핸드오프 스펙 v1.1

> **버전**: v1.1 (5인 검토 패널 반영)
> **작성일**: 2026-05-17
> **대상**: Claude Code 자율 실행
> **상위 프로젝트**: Limo pSEO 포트폴리오 4번째 사이트 (DoctorMap → LawGiver → Geumrijigi → **Dolbomjigi**)
> **이전 결정 사항**: 이 문서는 [기획 단계 5인 검토 패널] 권고 (Phase 1 80~100p 확대, T4 우선, 의료 표현 회피, 백업 데이터 소스 다중화, EEAT 외부 감수자, 3개월 재평가 기준)를 모두 반영한 v1.1입니다.

---

## 0. 프로젝트 정체성

### 0.1 사이트 개요

- **사이트명**: 돌봄지기 (Dolbomjigi)
- **도메인 후보**: `dolbomjigi.com` (1순위) / `dolbomjigi.kr` (2순위)
- **카테고리**: 시니어 돌봄로봇 + 컴패니언 로봇 정보·신청·도입 가이드
- **포지셔닝**: "일반 소비자용 반려로봇 추천 사이트"가 **아님**. "어르신 돌봄로봇 정보·신청·도입 가이드"로 B2G·B2B 키워드를 메인 트래픽 풀로, B2C 효도 선물 키워드를 시즌성 보조 풀로 운영.

### 0.2 타겟 사용자 (4 그룹 듀얼 페르소나)

| 그룹 | 검색 의도 | 주력 키워드 패턴 | 매칭 페이지 |
|---|---|---|---|
| 자녀군 (40~50대) | 부모 돌봄 솔루션 탐색 | "부모님 선물", "어머니 외로움", "독거노인 안전" | T3 페르소나 + T1 제품 |
| 사회복지사·생활지원사 | 현장 사용·자격증 | "노인맞춤돌봄 ICT", "생활지원사 안전관리기기" | T3 페르소나 + T4 사업 |
| 지자체 공무원 | 보급사업 운영·벤치마킹 | "지자체 돌봄로봇 보급", "AI 돌봄 사업" | T4 사업 |
| 요양원·복지관 운영자 | B2B 도입 가이드 | "요양원 돌봄로봇 도입", "복지관 AI 로봇" | T6 B2B |

### 0.3 수익화

1. **AdSense (주력)** — 시니어 헬스케어, 실버보험, 요양원, 영양제, 안마기 광고
2. **제휴 (보조)** — 효돌·다솜 등 한국 제조사 affiliate (Phase 3에서 협의)
3. **B2B 리드 (선택)** — T6 페이지에서 제조사 광고 모델 (AdSense 외부)

### 0.4 차별화 (3대 자산)

1. **지자체 보급사업 단일 매트릭스** — 한국에서 거의 비어 있는 SEO 공간
2. **자녀↔복지사 듀얼 페르소나 가이드** — T3 페이지 차원이 다른 사이트에 없음
3. **EEAT 강한 정부·학술 인용 풀** — 공공데이터 + 외부 감수자 + 학술 인용

---

## 1. 아키텍처 & 기술 스택

| Layer | Stack | 비고 |
|---|---|---|
| Framework | Next.js 15 (App Router) | Geumrijigi와 동일 |
| Hosting | Vercel Pro (Paid) | Hobby 한계 무시 가능 |
| Database | Turso (libSQL) | edge replication |
| ORM | Drizzle ORM | TypeScript |
| Package Manager | pnpm | 모노레포 가능 |
| CI/CD | GitHub Actions | |
| Cron | GitHub Actions cron + Vercel Cron | 이중화 |
| SEO | next-seo, next-sitemap | |
| Indexing | IndexNow API | Naver + Bing 동시 |
| Image | next/image | Vercel optimization |
| Analytics | GA4, GSC, AdSense | API 통합 |
| Monitoring | Multi-site Operations Dashboard 연동 | 별도 스펙 참조 |

---

## 2. URL 구조

```
/                                          # 홈
/robot/[slug]                              # T1 제품 상세
/compare/[slug-a]-vs-[slug-b]              # T2 페어 비교
/ranking/[category]                        # T2 카테고리 랭킹
/guide/[persona-slug]                      # T3 페르소나 가이드
/support/region/[sido]                     # T4 광역지자체 사업
/support/region/[sido]/[sigungu]           # T4 기초지자체 사업
/support/national/[program-slug]           # T4 국가 단위 사업
/info/[topic-slug]                         # T5 정보 페이지
/research/[study-slug]                     # T5 연구 인용
/business/[type-slug]                      # T6 B2B 가이드
/authors/[slug]                            # EEAT 저자 프로필
/about, /privacy, /terms                   # 메타
/feed.xml                                  # Naver RSS
/sitemap.xml                               # 자동 생성
```

**URL slug 규칙**:
- ASCII 영문 소문자 + 하이픈만
- 페이지 제목·본문은 한글
- 한국 제품: 영문명 사용 (hyodol, dasom-k, dasom-b, dasom-m, kkumdoli, gwangmyeongi-bomi, raemi, maibom)
- 글로벌 제품: brand 사용 (aibo, lovot, moflin, emo, elliq, paro)
- 지자체: 행정구역 코드 기반 영문 slug (seoul, busan, daegu/buk, gyeonggi/seongnam 등)

---

## 3. Drizzle 스키마

> 파일 위치: `src/db/schema/`

### 3.1 robots (제품 코어)

```typescript
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const robots = sqliteTable('robots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name_ko: text('name_ko').notNull(),
  name_en: text('name_en'),
  manufacturer: text('manufacturer').notNull(),
  manufacturer_country: text('manufacturer_country'),
  category: text('category', {
    enum: ['companion', 'senior_care', 'rehabilitation', 'monitoring']
  }).notNull(),
  korea_market: integer('korea_market', { mode: 'boolean' }).default(false),
  price_min: integer('price_min'),                   // 원 단위
  price_max: integer('price_max'),
  subscription_monthly: integer('subscription_monthly'),
  rental_available: integer('rental_available', { mode: 'boolean' }).default(false),
  release_year: integer('release_year'),
  manufacturer_url: text('manufacturer_url'),
  description_short: text('description_short'),      // 150자 이내, OG 용도
  features_json: text('features_json'),              // [{key, label, value}]
  hero_image_url: text('hero_image_url'),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### 3.2 regions (행정구역)

```typescript
export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sido_code: text('sido_code').notNull(),
  sigungu_code: text('sigungu_code'),
  sido_name: text('sido_name').notNull(),
  sigungu_name: text('sigungu_name'),
  level: text('level', { enum: ['sido', 'sigungu'] }).notNull(),
  slug: text('slug').notNull().unique(),
  population_65plus: integer('population_65plus'),    // KOSIS 시드
  single_elderly_households: integer('single_elderly_households'),
});
```

**시드 데이터**: 17개 광역 + 226개 기초 = 243 rows. KOSIS API에서 고령자 인구 데이터 동시 시드.

### 3.3 support_programs (지자체·국가 보급사업)

```typescript
export const support_programs = sqliteTable('support_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  region_id: integer('region_id').references(() => regions.id),  // null이면 국가단위
  name_ko: text('name_ko').notNull(),
  program_type: text('program_type', {
    enum: ['free_distribution', 'rental', 'subsidy', 'rd_grant']
  }).notNull(),
  eligibility_json: text('eligibility_json'),         // {age, income, residence, ...}
  application_method: text('application_method'),
  application_url: text('application_url'),
  period_start: integer('period_start', { mode: 'timestamp' }),
  period_end: integer('period_end', { mode: 'timestamp' }),
  budget: integer('budget'),
  distribution_count: integer('distribution_count'),  // 보급 대수
  source_url: text('source_url').notNull(),
  source_publication_date: integer('source_publication_date', { mode: 'timestamp' }),
  source_license: text('source_license').default('공공누리 제1유형'),
  last_seen: integer('last_seen', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'closed', 'unknown'] }).default('active'),
  human_reviewed: integer('human_reviewed', { mode: 'boolean' }).default(false),  // 게시 게이트
  reviewer_id: integer('reviewer_id'),                // 누가 review했는지
});
```

### 3.4 bizinfo_programs (자동 수집)

```typescript
export const bizinfo_programs = sqliteTable('bizinfo_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pblanc_id: text('pblanc_id').notNull().unique(),
  title: text('title').notNull(),
  dept: text('dept').notNull(),
  region: text('region'),
  field: text('field'),                               // 금융/기술/인력/...
  start_date: integer('start_date', { mode: 'timestamp' }),
  end_date: integer('end_date', { mode: 'timestamp' }),
  detail_url: text('detail_url'),
  matched_keywords: text('matched_keywords'),
  raw_json: text('raw_json'),                         // 원본 보존
  fetched_at: integer('fetched_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### 3.5 관계 테이블

```typescript
export const robot_region_availability = sqliteTable('robot_region_availability', {
  robot_id: integer('robot_id').references(() => robots.id).notNull(),
  region_id: integer('region_id').references(() => regions.id).notNull(),
  via_program_id: integer('via_program_id').references(() => support_programs.id),
  distribution_count: integer('distribution_count'),
}, (t) => ({ pk: primaryKey({ columns: [t.robot_id, t.region_id] }) }));

export const program_robots = sqliteTable('program_robots', {
  program_id: integer('program_id').references(() => support_programs.id).notNull(),
  robot_id: integer('robot_id').references(() => robots.id).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.program_id, t.robot_id] }) }));
```

### 3.6 콘텐츠 메타

```typescript
export const comparisons = sqliteTable('comparisons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  robot_a_id: integer('robot_a_id').references(() => robots.id).notNull(),
  robot_b_id: integer('robot_b_id').references(() => robots.id).notNull(),
  title_ko: text('title_ko').notNull(),
  summary: text('summary'),
  pros_a_json: text('pros_a_json'),
  pros_b_json: text('pros_b_json'),
  recommended_persona: text('recommended_persona'),
  author_id: integer('author_id').references(() => authors.id),
  reviewer_id: integer('reviewer_id').references(() => authors.id),
  published_at: integer('published_at', { mode: 'timestamp' }),
});

export const guides = sqliteTable('guides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  persona_group: text('persona_group', {
    enum: ['family_caregiver', 'social_worker', 'public_servant', 'institution']
  }).notNull(),
  scenario: text('scenario').notNull(),
  title_ko: text('title_ko').notNull(),
  body_md: text('body_md').notNull(),
  recommended_robots_json: text('recommended_robots_json'),
  author_id: integer('author_id').references(() => authors.id),
  reviewer_id: integer('reviewer_id').references(() => authors.id),  // EEAT 감수자
  published_at: integer('published_at', { mode: 'timestamp' }),
});

export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  role: text('role'),                                 // "운영자", "감수자" 등
  credentials_json: text('credentials_json'),         // [{type, issuer, year}]
  bio_short: text('bio_short'),
  avatar_url: text('avatar_url'),
});

export const research_studies = sqliteTable('research_studies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  authors_list: text('authors_list'),
  journal: text('journal'),
  year: integer('year'),
  doi: text('doi'),
  url: text('url'),
  summary_ko: text('summary_ko'),
  cited_robots_json: text('cited_robots_json'),
});
```

---

## 4. 데이터 수집 파이프라인

### 4.1 bizinfo.go.kr API (Daily)

```
GET https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do
Params:
  - crtfcKey={API_KEY}
  - dataType=json
  - searchCnt=100
  - hashtags={field}            (8개 분야: 금융/기술/인력/수출/내수/창업/경영/기타)
  - searchPosblRegnNm={region}  (17개 광역시도)
Rate limit: 개발계정 1,000건/일 (운영계정 신청 시 증가)
```

**키워드 매칭 필터**:
```typescript
const TARGET_KEYWORDS = [
  '돌봄로봇', '돌봄 로봇', '반려로봇', '반려 로봇',
  'AI 돌봄', 'AI돌봄', '시니어 로봇', '시니어로봇',
  '노인 돌봄', '노인돌봄', '독거 노인', '독거노인',
  '지능형 로봇', '지능형로봇', '웨어러블 돌봄',
  '효돌', '다솜', '꿈돌이', '광명이', '보미',
  '재활 로봇', '재활로봇', '복지용구',
];

function isRelevant(text: string): { matched: boolean; keywords: string[] } {
  const hits = TARGET_KEYWORDS.filter(kw => text.includes(kw));
  return { matched: hits.length > 0, keywords: hits };
}
```

### 4.2 백업 데이터 소스 (P2 김지윤 권고: bizinfo 단일 의존 위험 분산)

| 소스 | 용도 | 갱신 | API/형식 |
|---|---|---|---|
| **NTIS** | 정부 R&D 과제 (돌봄로봇) | 일 1회 | 검색 API |
| **KIPRIS** | 특허 동향 | 일 1회 | 키워드 검색 API |
| **KOSIS** | 고령자·1인가구·돌봄 통계 | 월/연 | OpenAPI |
| **사회보장정보원** | 복지사업 정보 | 주 | RSS, 보도자료 |
| **보건복지부 정책 RSS** | 부처 보도자료 | 일 | RSS |
| **KIRIA 로봇산업 정책동향** | 연감 데이터 | 연 1회 | data.go.kr 파일 |
| **국립재활원** | 돌봄로봇 R&D 결과 | 비정기 | 보도자료 |

각 소스별 자동 수집 모듈을 `src/etl/sources/` 하위에 분리:
```
src/etl/sources/
├── bizinfo.ts
├── ntis.ts
├── kipris.ts
├── kosis.ts
├── mohw-rss.ts
├── kiria-annual.ts
└── municipal-crawler.ts
```

### 4.3 지자체 크롤링 (Weekly, Human-Review-Required)

**Phase 1 대상**:
- 17개 광역 RSS 우선 (모두 정비 잘 됨)
- 226개 기초 중 RSS·정보공개포털 잘 갖춘 50~80곳

**공공누리 라이선스 가드 (P2 우려 핵심 반영)**:
- 정부 보도자료는 공공누리 제1~4유형 확인
- 변형 금지(제3, 제4)는 인용 형태만 허용
- 모든 페이지에 출처 URL + 라이선스 표시 의무

**Human review queue (메모리 가드: "Content body modification is off-limits")**:
- 자동 분류 → review queue → 사람 승인 → 게시
- 본문 자동 수정 절대 금지
- 구조·메타·태그·요약(자체 작성)만 자동화 허용

```typescript
// src/etl/review-queue.ts
async function enqueueForReview(program: SupportProgramDraft) {
  await db.insert(support_programs).values({
    ...program,
    human_reviewed: false,
    status: 'unknown',
  });
  // Slack/Email 알림
  await notifyReviewer({
    type: 'new_municipal_program',
    title: program.name_ko,
    source: program.source_url,
  });
}
```

### 4.4 KIRIA 연감 (Annual)

- `data.go.kr` "한국로봇산업진흥원_로봇산업 정책동향" 파일 모니터링
- 신규 게시 감지 시 Slack 알림
- PDF/HWP 파싱: Python `pdfplumber` (별도 워크플로우)
- T5 시장통계 페이지 데이터 교체 (수동 검수 후)

### 4.5 ETL 크론 정의

```yaml
# .github/workflows/etl.yml
on:
  schedule:
    - cron: '0 18 * * *'    # Daily 03:00 KST: bizinfo + 보건복지부 RSS
    - cron: '0 19 * * *'    # Daily 04:00 KST: NTIS + KIPRIS
    - cron: '0 21 * * 0'    # Weekly Mon 06:00 KST: 지자체 크롤링
    - cron: '0 0 1 * *'     # Monthly 1st: KOSIS 통계 동기화
    - cron: '0 0 1 1 *'     # Yearly: KIRIA 연감 체크
```

---

## 5. 페이지 템플릿 (6 Tier)

### 5.1 T1 제품 상세 — `/robot/[slug]/page.tsx`

```typescript
// 페이지 구조
1. <Hero>               제품명 + 카테고리 + 가격 요약 + 헤더 이미지
2. <AnswerBlock>        250자 핵심 답변 (AEO·LLM citation용)
3. <FeatureList>        핵심 기능 5~7개 (아이콘 + 1문장 설명)
4. <PricingTable>       구매·구독·대여 옵션 (단가·약정·A/S 비용)
5. <PersonaFit>         적합 사용자 → T3 cross-link
6. <RegionalAvailability> 지자체 보급 현황 → T4 cross-link
7. <ComparisonCTA>      추천 비교 페이지 → T2 cross-link
8. <FAQ>                5~8개
9. <Sources>            출처 (제조사·정부·언론·연구)
10. <AuthorBlock>       저자·감수자 (EEAT)

// JSON-LD
- Product (price, brand, description, image)
- FAQPage
- BreadcrumbList
```

### 5.2 T2 페어 비교 — `/compare/[slug-a]-vs-[slug-b]/page.tsx`

```typescript
1. <ComparisonHero>     "A vs B" 헤더
2. <OneLineVerdict>     한 줄 결론 (어떤 케이스에 누가 낫나)
3. <DiffTable>          핵심 차이 표 (5~10 차원)
4. <PriceCompare>       가격·구독·대여 비교
5. <PersonaRecommend>   페르소나별 추천
6. <UserReviewSummary>  공식 자료·보도자료 기반 평가 요약
7. JSON-LD: Comparison (custom) + Product x2
```

### 5.3 T3 페르소나 가이드 — `/guide/[persona-slug]/page.tsx`

```typescript
1. <PersonaIntro>       페르소나 정의 (예: "혼자 사는 80대 어머니")
2. <NeedsAnalysis>      필요 기능 분석
3. <RecommendedRobots>  추천 제품 TOP 3 → T1
4. <PriceTierGuide>     가격대별 옵션 (50만/100만/200만+)
5. <SupportProgramHint> 받을 수 있는 지원사업 → T4
6. <FAQ>                해당 페르소나 FAQ
7. <AuthorBlock>        저자·감수자
8. JSON-LD: Article + FAQPage
```

**페르소나 슬러그 예시 (Phase 1 우선)**:
- `parents-80s-gift` — 80대 부모님 선물용
- `mom-living-alone` — 혼자 사는 어머니
- `cognitive-care-elderly` — 인지 건강 관리 필요한 어르신 (※ "치매 예방" X)
- `social-worker-guide` — 사회복지사용 현장 가이드
- `welfare-village-program` — 스마트경로당 도입 가이드

### 5.4 T4 지원사업 — `/support/region/[sido]/[sigungu]/page.tsx`

```typescript
1. <ProgramHero>        지자체명 + 사업명 + 연도
2. <AnswerBlock>        250자 핵심 (자격·신청법 요약)
3. <EligibilityTable>   자격 요건
4. <ApplicationFlow>    신청 방법·기한·창구
5. <SupportContent>     지원 내용 (무상/대여/지원금)
6. <CoveredRobots>      적용 제품 → T1
7. <UpdateNotice>       최근 갱신일 + 출처 URL + 라이선스 표시 (필수)
8. <RelatedRegions>     주변 지자체 사업 (cross-link)
9. JSON-LD: GovernmentService + BreadcrumbList

// 가드: 본문 자동 수정 절대 금지. 정부 보도자료 인용 형태만.
```

### 5.5 T5 정보·연구 — `/info/[topic-slug]` & `/research/[study-slug]`

```typescript
// /info/[topic-slug]
1. <TopicIntro>
2. <AnswerBlock>        250자 핵심
3. <BodyContent>        2000자 이상, 50~150단어 청크 구조
4. <RelatedResearch>    연구 인용 (research_studies)
5. <Sources>
6. <AuthorBlock>
7. JSON-LD: Article

// /research/[study-slug]
- 학술 논문·정부 보고서 요약 페이지
- 인용 형태로만, 원문 재구성 금지
- DOI·URL 출처 필수
- JSON-LD: ScholarlyArticle
```

### 5.6 T6 B2B — `/business/[type-slug]/page.tsx`

```typescript
1. <BusinessIntro>      대상 시설 정의 (요양원·복지관·경로당)
2. <IntroductionFlow>   도입 절차 (검토→비교→견적→설치→운영)
3. <ROIEstimate>        비용·운영효율·정부 지원 매칭
4. <CoveredPrograms>    해당 시설이 받을 수 있는 정부 지원 → T4
5. <RecommendedProducts> 기관용 추천 제품 → T1
6. <ContactBlock>       제조사 컨택 (광고 모델, 옵션)
7. JSON-LD: HowTo + Article
```

---

## 6. SEO·AEO·GEO

### 6.1 기본 설정

- `next-sitemap`: priority (T1=0.9, T4=0.8, T3=0.7, T5=0.6, T2=0.6, T6=0.5)
- `/feed.xml` RSS — Naver Search Advisor 등록 필수
- IndexNow API — Naver + Bing 동시 ping (배포 시 자동)
- `robots.txt`: Yeti, Googlebot, Bingbot 명시 허용
- 모든 페이지 JSON-LD 필수
- `<h1>` 1개, `<h2>` 명확 구조
- `<answer-block>` 250자 이내 핵심 답변 (질문형 페이지 헤더 아래)

### 6.2 한국 검색엔진 추가 설정 (P4 최우진 권고)

- **C-Rank 강화**: 정부·언론·학술 출처 명시. 출처 다양성·신뢰도 확보
- **D.I.A. 강화**: 50~150 단어 청크 구조. 짧은 페이지 지양 (T3 이상은 2000자+)
- Naver Search Advisor 등록 + sitemap + RSS 모두 제출
- Naver 블로그·카페 백링크 확보 (Phase 2에서 직접 운영)

### 6.3 AEO·LLM citation 최적화

- `<answer-block>` 컴포넌트로 모든 페이지 핵심 답변 250자 캡슐화
- 50~150 단어 단락 구조 (LLM 인용 빈도 2.3x)
- FAQ 구조화 (FAQPage JSON-LD)

---

## 7. AdSense 정책 가이드 (P1 박상민 권고 반영)

### 7.1 의료기기 광고 정책 충돌 회피 (필수)

| ❌ 회피 표현 | ✅ 대체 표현 |
|---|---|
| 치매 예방 | 인지 건강 지원 |
| 치료 | 보조 |
| 처방 | 맞춤 안내 |
| 의료기기 | 복지용구, 돌봄기기 |
| 환자 | 어르신, 사용자 |
| 진단 | 상태 확인 |
| 효능 | 기능 |

코드 차원에서 가드:
```typescript
// src/lib/content-linter.ts
const FORBIDDEN_TERMS = ['치매 예방', '치료', '처방', '의료기기', '환자', '진단', '효능'];
export function lintContent(text: string): { ok: boolean; violations: string[] } {
  const violations = FORBIDDEN_TERMS.filter(t => text.includes(t));
  return { ok: violations.length === 0, violations };
}
```

CI에서 모든 콘텐츠 파일 lint 통과 강제. 예외 필요 시 명시적 화이트리스트(인용 블록 등).

### 7.2 Scaled Content Abuse 가드 (메모리 가드 강화)

- T2 비교, T3 페르소나는 자동 생성 **금지**. 템플릿 + 사람 작성·감수
- T4 지원사업도 본문은 사람 review queue 후 게시
- T5 정보는 100% 사람 작성
- 자동화는 데이터 수집·메타·구조·태그 갱신에 한정

### 7.3 광고 배치 전략

| Tier | 본문 중간 | 사이드 | 푸터 | 비고 |
|---|---|---|---|---|
| T1 제품 | ✅ | ✅ | ✅ | 최고 RPM 페이지 |
| T2 비교 | ✅ | - | ✅ | 비교표 아래 중심 |
| T3 페르소나 | ✅ | ✅ | - | 감정 호소, RPM 중상 |
| T4 지원사업 | - | ✅ | - | RPM 낮음, 광고 거부감 |
| T5 정보 | ✅ | - | ✅ | |
| T6 B2B | - | - | - | 직접 광고 모델, AdSense 제외 옵션 |

---

## 8. EEAT 빌딩 (P3·P4 권고 반영)

### 8.1 저자 프로필

- `/authors/[slug]` 필수 페이지
- 자격증·경력·연락처(메일) 명시
- 모든 콘텐츠 페이지 하단에 `<AuthorBlock>` 노출

### 8.2 외부 감수자

- **현직 사회복지사 또는 노인복지 전공 교수 1~2명 섭외**
- 보수 협의 (월 30~50만원 예산 + 건당 5~10만원 모델)
- T3·T6 페이지에 "감수: [이름], [자격]" 표시

### 8.3 출처·인용 가이드

- 모든 통계·연구·정책 정보는 출처 URL 필수
- 정부 자료는 공공누리 라이선스 명시
- 학술 자료는 DOI·저널 표시
- 본문은 인용 형태로, 원문 재구성 금지

---

## 9. Phase 로드맵

### 9.1 Phase 1 (Week 1~12)

**목표**: 80~100 페이지 + AdSense 승인 + 첫 트래픽

| Tier | 페이지 수 | 비고 |
|---|---|---|
| T1 한국 제품 | 8 | 효돌, 다솜M/B/K, 꿈돌이, 광명·보미, 래미, 마이봄 |
| T1 글로벌 제품 | 5 | Aibo, Lovot, Moflin, ElliQ, PARO |
| T2 페어 비교 | 10 | 한국 제품 중심 |
| T2 카테고리 랭킹 | 5 | 가격대·페르소나·기능별 |
| T3 자녀군 페르소나 | 10 | parents-80s-gift 등 |
| T3 복지사군 페르소나 | 5 | social-worker-guide 등 |
| T4 광역 17 | 17 | 17개 광역시도 |
| T4 주요 기초 | 20 | 보급사업 활성화된 곳 |
| T5 정보 | 10 | 핵심 토픽 |
| T5 연구 | 5 | 학술 인용 |
| T6 B2B 도입 | 5 | 요양원·복지관·경로당 |
| **합계** | **100** | |

AdSense 신청 게이트: Phase 1 70% 완료 + 60일 도메인 경과.

### 9.2 Phase 2 (Month 4~6)

**목표**: 200~280 페이지, 매트릭스 확장

- T2 자동 페어 비교 30 + T3 페르소나 30 추가
- T4 기초지자체 30~60곳 추가 → 누적 67~97
- T5 정보 20 추가
- 자동화 파이프라인 안정화

### 9.3 Phase 3 (Month 7~12)

**목표**: 600~1,100 페이지, 수익 모델 다변화

- T6 B2B 확장
- 효돌·다솜 affiliate 협의·도입
- 영어 확장 (`/en/`) 검토
- Multi-site 운영 대시보드 통합

### 9.4 3개월 재평가 기준 (P5 정상우 강력 권고, NO-GO 조건 사전 박기)

- **GSC 노출 < 10,000** → Pivot 검토
- **GSC 클릭 < 500** → Pivot 검토
- **AdSense 미승인 (Phase 1 완료 후 30일 내)** → 콘텐츠 보강 + 재신청
- **양쪽 다 미달 + AdSense 미승인** → 다음 옵션 중 택1:
  1. 영어 시장 확장
  2. "시니어 라이프" 일반 정보 사이트로 확장
  3. 우선순위 낮추고 다른 포트폴리오 집중

---

## 10. 운영 & 모니터링

- Multi-site Operations Dashboard 스펙 연동 (별도 문서)
- GSC API, GA4 Data API, AdSense Management API 일 1회 수집
- 이상치 감지: 노출·클릭·CTR 7일 이동평균 ±30% 벗어나면 Slack·이메일 알림
- ETL 실패율 모니터링 (bizinfo·NTIS·KIPRIS·KOSIS 각각)
- 지자체 크롤링 실패율 + review queue 적체 모니터링

---

## 11. 리스크 & 가드레일 (5인 패널 통합)

| 리스크 | 출처 페르소나 | 대응 |
|---|---|---|
| AdSense 미승인 | P1 박상민 | Phase 1 80~100p + 의료 표현 회피 lint + 외부 감수자 |
| 지자체 크롤링 법적 리스크 | P2 김지윤 | 공공누리 라이선스 검증 + 인용 형태 한정 + review queue |
| bizinfo 정책 변경 | P2 김지윤 | 백업 소스 4종 다중화 (NTIS, KIPRIS, KOSIS, RSS) |
| 키워드 볼륨 부족 | P4 최우진, P5 정상우 | 3개월 재평가 + pivot 옵션 사전 정의 |
| Scaled Content Abuse | (메모리 가드) | T1·T3·T5 100% 사람 작성, T2·T4 review queue |
| YMYL EEAT 부족 | P3 이혜진, P4 최우진 | 외부 감수자 + 학술 인용 + 저자 프로필 |
| 시장 천장 | P5 정상우 | 영어 확장 옵션 사전 설계 |
| 본문 자동 수정 사고 | (메모리 가드) | ETL은 메타·구조만 갱신, 본문은 review queue |
| 대기업 진입 | P5 정상우 | 차별화 자산(지자체 매트릭스) 빠른 점유 |
| 시즌성 변동 (어버이날) | P3 이혜진 | T3 자녀군 콘텐츠 시즌 사전 발행 |

---

## 12. Phase 1 즉시 실행 체크리스트

### 12.1 인프라

- [ ] 도메인 등록: dolbomjigi.com (1순위) / dolbomjigi.kr (2순위)
- [ ] GitHub 레포 생성 + Next.js 15 (App Router, TypeScript) 초기화
- [ ] pnpm workspace 셋업
- [ ] Vercel 프로젝트 연결 (Pro 플랜)
- [ ] Turso DB 생성 + Drizzle migration 적용
- [ ] GitHub Actions secrets 설정 (BIZINFO_API_KEY, TURSO_DB_URL, GSC API, etc.)

### 12.2 데이터 시드

- [ ] regions: 17 광역 + 226 기초 시드 (KOSIS 인구 데이터 동시)
- [ ] robots: 한국 8 + 글로벌 5 = 13 시드
- [ ] authors: 운영자 1 + 외부 감수자 1~2 시드
- [ ] support_programs: 17 광역 보급사업 초기 시드 (수동 수집)

### 12.3 API 키·인증

- [ ] bizinfo.go.kr API 키 발급
- [ ] data.go.kr 회원 가입 + KIRIA 데이터셋 활용신청
- [ ] NTIS·KIPRIS·KOSIS API 키 발급
- [ ] Naver Search Advisor 사이트 등록
- [ ] GSC 사이트 등록
- [ ] AdSense 신청 준비 (Phase 1 70% 완료 시)

### 12.4 컴포넌트·페이지

- [ ] T1·T4 React 컴포넌트 우선 구현 (최우선 트래픽 풀)
- [ ] `<AnswerBlock>`, `<AuthorBlock>`, `<UpdateNotice>` 공통 컴포넌트
- [ ] JSON-LD 헬퍼 (`src/lib/jsonld/`)
- [ ] Content linter (`src/lib/content-linter.ts`) — 의료 표현 가드

### 12.5 ETL

- [ ] bizinfo API 모듈 (`src/etl/sources/bizinfo.ts`)
- [ ] KOSIS 모듈
- [ ] 보건복지부 RSS 모듈
- [ ] Review queue + Slack 알림
- [ ] GitHub Actions cron 설정

### 12.6 SEO 기본

- [ ] next-sitemap 설정
- [ ] /feed.xml RSS 발행
- [ ] IndexNow 자동 ping 설정
- [ ] robots.txt
- [ ] OG·Twitter 카드 자동 생성

### 12.7 EEAT 준비

- [ ] 외부 감수자 컨택 (현직 사회복지사 또는 노인복지 전공 교수 1~2명)
- [ ] /authors/[slug] 페이지 구현
- [ ] /about, /privacy, /terms 페이지 작성

### 12.8 콘텐츠 작성

- [ ] T1 13개 작성 (인간 작성, 1500~2500자 each)
- [ ] T4 광역 17 + 기초 20 작성 (정부 자료 인용 형태, 출처 명시)
- [ ] T3 15개 작성 (감수자 검수)
- [ ] T5 15개 작성 (학술 인용 포함)
- [ ] T2 15개 작성 (T1 완료 후)
- [ ] T6 5개 작성

### 12.9 런칭 후 (Week 12 이후)

- [ ] AdSense 신청
- [ ] GSC·GA4·AdSense Management API 통합 (Multi-site 대시보드 연동)
- [ ] 3개월 재평가 KPI 모니터링 시작

---

## 부록 A: 핵심 의사결정 로그

| Decision ID | 결정 사항 | 근거 | 출처 |
|---|---|---|---|
| D-001 | 사이트명 = 돌봄지기 | 시리즈 일관성 (지기 패턴) | 사용자 선호 |
| D-002 | 범위 = 컴패니언 + 시니어 케어 | pSEO 매트릭스 viability + 한국 시장 차별화 | 5인 패널 합의 |
| D-003 | Phase 1 = 80~100p | 60p는 YMYL AdSense 빠듯 + Naver 사이트 규모 평가 | P1, P4 권고 |
| D-004 | T4 우선 + T1 보조 (MVP) | T4 차별화 강 + EEAT 자산 빌딩 + 경쟁 약 | P3, P4 합의 |
| D-005 | 의료 표현 lint 강제 | 의료기기 광고 정책 충돌 회피 | P1 권고 |
| D-006 | 백업 데이터 소스 4종 | bizinfo 단일 의존 위험 | P2 권고 |
| D-007 | 외부 감수자 섭외 | YMYL EEAT 빌딩 | P3, P4 권고 |
| D-008 | 3개월 재평가 KPI 사전 박기 | NO-GO 옵션 명시 | P5 권고 |
| D-009 | 본문 자동 수정 절대 금지 | Scaled Content Abuse 회피 | 메모리 가드 |
| D-010 | 공공누리 라이선스 인용 형태만 | 정부 자료 저작권 가드 | P2 권고 |

---

## 부록 B: 참조 문서

- Universal CLAUDE.md (Next.js 프로젝트 공통 SEO/AEO/GEO 가이드)
- Multi-site Operations Dashboard 스펙
- Geumrijigi v1.0 (이전 pSEO 사이트 참조 모델)
- AdSense Optimizer skill (`adsense-optimizer`)

---

## 부록 C: 다음 문서 산출물 (Phase 1 진입 전 추가 필요)

1. **콘텐츠 작성 가이드 v1.0** — T1~T6 각 템플릿별 작성 룰북
2. **외부 감수자 섭외 가이드** — 컨택 방법·계약 모델·검수 워크플로우
3. **공공누리 라이선스 가드 v1.0** — 인용 형식·출처 표시 규칙
4. **3개월 재평가 대시보드** — Multi-site 대시보드 연동 명세

---

**문서 종결.** 이 스펙으로 Claude Code 자율 실행 가능. 추가 결정 필요 사항은 부록 A에 누적 기록.
