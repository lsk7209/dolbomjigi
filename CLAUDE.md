@AGENTS.md

# 돌봄지기 (Dolbomjigi) — 개발 가이드

## 프로젝트 개요

시니어 돌봄로봇 정보·신청·도입 pSEO 사이트.
Next.js 15 (App Router) + Turso (libSQL) + Drizzle ORM + Vercel Pro

## 핵심 가드레일 (절대 위반 금지)

### 1. 의료 표현 금지 (content-linter.ts 강제)

- 금지: 치매 예방, 치료, 처방, 의료기기, 환자, 진단, 효능, 약효
- 대체: 인지 건강 지원, 보조, 맞춤 안내, 복지용구, 어르신, 상태 확인, 기능
- CI에서 자동 차단. 예외: `<blockquote>` 인용 블록 내부

### 2. T4 본문 자동 수정 절대 금지

- ETL은 메타·구조·태그만 자동화
- 본문은 `human_reviewed=true` 설정 후에만 게시

### 3. 공공누리 라이선스

- 제2, 제4유형 사용 불가 (상업적 이용 금지 충돌)
- 모든 정부 자료에 출처 URL + 라이선스 표시 의무

## URL 구조 (T1~T6 6티어)

| 티어 | 경로 예시 | 설명 |
|------|-----------|------|
| T1 | `/` | 홈 |
| T2 | `/robot/`, `/support/`, `/guide/` | 카테고리 허브 |
| T3 | `/robot/[slug]` | 개별 로봇 상세 |
| T4 | `/support/national/[slug]` | 지원사업 상세 |
| T5 | `/support/region/[sido]/[sigungu]` | 지역별 지원 |
| T6 | `/research/[slug]`, `/business/[slug]` | 심층 가이드 |

## DB 명령어

```bash
pnpm db:generate  # 마이그레이션 생성
pnpm db:migrate   # Turso에 적용
pnpm db:seed      # 초기 데이터 삽입
pnpm db:studio    # Drizzle Studio 실행
```

## 환경변수 (.env.local)

| 변수 | 설명 |
|------|------|
| `TURSO_DATABASE_URL` | `libsql://...` Turso DB URL |
| `TURSO_AUTH_TOKEN` | JWT 토큰 |
| `BIZINFO_API_KEY` | bizinfo.go.kr API 키 |
| `SLACK_WEBHOOK_URL` | ETL 알림 웹훅 |
| `INDEXNOW_KEY` | IndexNow 인증 키 |
| `CRON_SECRET` | Vercel Cron Bearer 인증 |
| `ADMIN_SECRET` | `/api/lint` 관리자 인증 |
| `KOSIS_API_KEY` | 통계청 오픈API 키 (선택) |
| `REVIEWER_EMAIL` | ETL 검토 알림 이메일 (선택) |

## 콘텐츠 작성 규칙

- 모든 페이지: `AnswerBlock` (250자), `AuthorBlock`, `Sources`, JSON-LD 필수
- T3·T6: 외부 감수자 검수 필수
- T4: `human_reviewed=true` 없이 게시 불가
- 가격·신청 정보: 확인일 표시 필수

## ETL 파이프라인

```
src/etl/
  run-daily.ts          # 일일 ETL 진입점 (pnpm tsx 직접 실행용)
  review-queue.ts       # 검토 대기열 + Slack 알림
  sources/
    bizinfo.ts          # bizinfo.go.kr API 수집
    mohw-rss.ts         # 보건복지부 RSS 수집
    kosis.ts            # 통계청 KOSIS API 수집
```

Vercel Cron 엔드포인트:
- `GET /api/cron/etl-daily`  — 매일 18:00 UTC, bizinfo + RSS 수집
- `GET /api/cron/etl-weekly` — 매주 일요일 21:00 UTC, 지자체 크롤링 큐 등록

## 관리자 API

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/lint` | POST | 콘텐츠 린터 실행 (`x-admin-secret` 헤더 필요) |
| `/api/feed` | GET | RSS 2.0 피드 |

## 개발 서버

```bash
pnpm dev   # http://localhost:3000
```

## 배포

Vercel Pro + GitHub Actions CI/CD 자동 배포
- `main` 브랜치 push → CI (type check / lint / content lint / build) → Vercel 자동 배포
- Cron 작업은 `vercel.json` 기준으로 Vercel이 자동 실행
