/**
 * ETL Review Queue 모듈
 * 자동 수집된 지원사업 데이터를 검토 대기열에 적재하고 담당자에게 알림을 발송한다.
 */

import type { NewSupportProgram } from '@/db/schema';

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────

/**
 * 수집 단계에서 아직 검토 전인 지원사업 초안
 * human_reviewed = false 상태로 DB에 삽입된다.
 */
export type SupportProgramDraft = Omit<NewSupportProgram, 'human_reviewed'> & {
  human_reviewed?: false;
  /** 출처 구분 (bizinfo | mohw_rss | local_gov 등) */
  etl_source?: string;
  /** 매칭된 키워드 목록 */
  matched_keywords?: string[];
};

export interface NotifyParams {
  type: string;    // 'bizinfo' | 'mohw_rss' | 'kosis' | 'manual'
  title: string;   // 공고명
  source: string;  // 출처 URL
  count?: number;  // 이번 배치에서 수집된 건수
}

export interface ReviewQueueResult {
  enqueued: number;
  skipped: number;
  errors: string[];
}

// ─────────────────────────────────────────
// Slack 웹훅
// ─────────────────────────────────────────

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? '';

interface SlackPayload {
  text?: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  [key: string]: unknown;
}

async function sendSlackMessage(payload: SlackPayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[ReviewQueue] SLACK_WEBHOOK_URL이 설정되지 않았습니다. 알림을 건너뜁니다.');
    return;
  }

  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`[ReviewQueue] Slack 알림 전송 실패: ${res.status} ${res.statusText}`);
  }
}

// ─────────────────────────────────────────
// 이메일 알림 (선택적)
// ─────────────────────────────────────────

/**
 * 이메일 알림은 외부 서비스(SendGrid, Resend 등) 연동이 필요하다.
 * 현재는 콘솔 로그로 대체하며, 실제 구현 시 환경변수로 서비스 키를 주입한다.
 */
async function sendEmailNotification(params: NotifyParams): Promise<void> {
  const emailTo = process.env.REVIEWER_EMAIL;
  if (!emailTo) return;

  // TODO: 실제 이메일 서비스(Resend, SendGrid 등)로 교체
  console.log(`[ReviewQueue] 이메일 알림 (미구현): to=${emailTo}, title=${params.title}`);
}

// ─────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────

/**
 * 수집된 지원사업 초안을 review queue에 적재한다.
 * support_programs 테이블에 human_reviewed=false 상태로 삽입하고,
 * 검토 알림을 발송한다.
 *
 * @param program - 삽입할 지원사업 초안 데이터
 */
export async function enqueueForReview(program: SupportProgramDraft): Promise<void> {
  // 지연 import: ETL 스크립트가 Edge runtime 외부에서 실행되므로
  // 동적 import로 DB 연결을 지연시킨다.
  const { db } = await import('@/db/client');
  const { supportPrograms } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const payload: NewSupportProgram = {
    ...program,
    human_reviewed: false,
  };

  try {
    // slug 기준 중복 확인
    const existing = await db
      .select({ id: supportPrograms.id })
      .from(supportPrograms)
      .where(eq(supportPrograms.slug, payload.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[ReviewQueue] 이미 존재하는 항목: ${payload.slug}`);
      return;
    }

    await db.insert(supportPrograms).values(payload);
    console.log(`[ReviewQueue] 적재 완료: ${payload.slug}`);
  } catch (err) {
    console.error(`[ReviewQueue] DB 적재 오류 (${payload.slug}):`, err);
    throw err;
  }
}

/**
 * 검토자에게 새 항목 수집 완료 알림을 발송한다.
 * Slack 웹훅 + 이메일(옵션)을 동시에 발송한다.
 *
 * @param params - 알림 파라미터
 */
export async function notifyReviewer(params: NotifyParams): Promise<void> {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const countText = params.count !== undefined ? ` (${params.count}건)` : '';

  const slackPayload: SlackPayload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `돌봄지기 ETL: 새 항목 수집 완료${countText}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*출처 유형:* ${params.type}`,
          },
          {
            type: 'mrkdwn',
            text: `*수집 시간:* ${now}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*최근 항목:* ${params.title}\n*URL:* ${params.source}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '검토하기' },
            url: process.env.REVIEW_DASHBOARD_URL ?? 'https://dolbomjigi.com/admin/review',
            style: 'primary',
          },
        ],
      },
    ],
  };

  await Promise.allSettled([
    sendSlackMessage(slackPayload),
    sendEmailNotification(params),
  ]);
}

/**
 * 배치 결과를 요약하여 Slack에 보고한다.
 */
export async function notifyBatchResult(results: {
  source: string;
  total: number;
  matched: number;
  enqueued: number;
  errors: string[];
}): Promise<void> {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const statusEmoji = results.errors.length === 0 ? '✅' : '⚠️';
  const errorText =
    results.errors.length > 0
      ? `\n*오류:*\n${results.errors.slice(0, 5).map((e) => `• ${e}`).join('\n')}`
      : '';

  const payload: SlackPayload = {
    text: [
      `${statusEmoji} *[${results.source}] ETL 배치 완료* - ${now}`,
      `전체 ${results.total}건 → 키워드 매칭 ${results.matched}건 → 적재 ${results.enqueued}건`,
      errorText,
    ]
      .filter(Boolean)
      .join('\n'),
  };

  await sendSlackMessage(payload);
}
