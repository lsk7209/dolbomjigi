import { createHash } from 'node:crypto';

// Only semantic fields belong here. A date-only edit must not invalidate or renew review.
export function contentVersion(content: Record<string, unknown>): string {
  const ignored = new Set(['updated_at','content_updated_at','source_checked_at','expert_reviewed_at','last_seen','published_at','created_at']);
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(content).filter(([key])=>!ignored.has(key)).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
}
export interface ExpertReviewEvidence {
  personVerified: boolean;
  credentialsVerified: boolean;
  participationEvidence: string;
  reviewedContentVersion: string;
  expertReviewedAt: string;
}
export function hasExpertReview(evidence: ExpertReviewEvidence | undefined, currentVersion?: string): boolean {
  return !!(evidence?.personVerified && evidence.credentialsVerified && evidence.participationEvidence.trim() && currentVersion && evidence.reviewedContentVersion === currentVersion && validRecordedDate(evidence.expertReviewedAt));
}
export function validRecordedDate(value?: string | null): string | undefined {
  return value && Number.isFinite(Date.parse(value)) ? value : undefined;
}
export function explicitCandidates<T extends { id:number }>(rows:T[], ids:number[]):T[] {
  return ids.flatMap(id => rows.filter(row=>row.id===id)).filter((row,index,all)=>all.findIndex(r=>r.id===row.id)===index);
}
export interface SupportEvidence {
  robotId:number;
  sourceUrl:string;
  checkedAt:string;
  recruitment:'open'|'closed'|'unknown';
  eligibility:string;
}
export function supportEligible(robotId:number, evidence:SupportEvidence[]):boolean {
  return evidence.some(e=>e.robotId===robotId && e.recruitment==='open' && /^https:\/\//.test(e.sourceUrl) && !!validRecordedDate(e.checkedAt) && !!e.eligibility.trim());
}
export function recruitmentLabel(program:{period_end:Date|null;period_start?:Date|null;status?:string},now=new Date()):string {
  if (program.period_end && program.period_end.getTime()<now.getTime()) return '기록된 모집 기간 종료 · 사업 운영 여부 별도 확인';
  if (program.period_start && program.period_start.getTime()>now.getTime()) return '기록된 모집 시작 전 · 현재 공고 확인 필요';
  return '현재 신규 모집 여부 확인 필요';
}
export function matchingRegion(parent:{sido_code:string;level:string}|undefined,child:{sido_code:string;level:string}|undefined):boolean {
  return !!parent && !!child && parent.level==='sido' && child.level==='sigungu' && parent.sido_code===child.sido_code;
}
