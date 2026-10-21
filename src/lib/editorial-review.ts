import { contentVersion } from './trust'
import { lintContent } from './content-linter'

export type EditorialState = 'draft'|'review-pending'|'approved'|'scheduled'|'public'
export interface EditorialEvidence {
  reviewer: string
  contentVersion: string
  reviewedAt: string
  sources: {url:string; claim:string; outcome:'matched'|'failed'|'unverified'; checkedAt?:string}[]
  answersTitle: boolean
  distinctContribution: boolean
  noInventedExperience: boolean
  productRegionPeriodMatch: boolean
  medicalClaimsReviewed: boolean
}

/** A structural pass is never factual approval. Evidence must refer to this version. */
export function reviewDecision(content:Record<string,unknown>, evidence?:EditorialEvidence) {
  const text=String(content.body_md ?? content.body_html ?? '')
  const reasons:string[]=[]
  if (!evidence?.reviewer.trim()) reasons.push('human-editor-required')
  if (!evidence || evidence.contentVersion!==contentVersion(content)) reasons.push('version-not-approved')
  if (!evidence?.reviewedAt || !Number.isFinite(Date.parse(evidence.reviewedAt))) reasons.push('review-date-missing')
  if (!evidence?.sources.length || evidence.sources.some(s=>s.outcome!=='matched' || !/^https:\/\//.test(s.url) || !s.claim.trim() || !s.checkedAt || !Number.isFinite(Date.parse(s.checkedAt)))) reasons.push('claim-source-not-verified')
  for (const key of ['answersTitle','distinctContribution','noInventedExperience','productRegionPeriodMatch'] as const) if (!evidence?.[key]) reasons.push(key)
  const wording=lintContent(text)
  if (!wording.ok && !evidence?.medicalClaimsReviewed) reasons.push('wording-needs-human-review')
  if (structuralIssues(text).length) reasons.push('structural-failure')
  return {approved:reasons.length===0,reasons,version:contentVersion(content),wording}
}

export function structuralIssues(body:string):string[] {
  const issues:string[]=[]
  const headings=[...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>m[1].trim())
  if (new Set(headings).size!==headings.length) issues.push('duplicate-heading')
  if ((body.match(/^# /gm)||[]).length>0) issues.push('body-h1-conflicts-with-page-h1')
  const paragraphs=body.split(/\n\s*\n/).map(x=>x.trim()).filter(x=>x.length>40)
  if (new Set(paragraphs).size!==paragraphs.length) issues.push('duplicate-paragraph')
  if ((body.match(/```/g)||[]).length%2) issues.push('unclosed-code-fence')
  if (/\]\((?:javascript:|data:)/i.test(body)) issues.push('unsafe-link')
  return issues
}

export function editorialState(publishedAt:Date|null, approvedVersion:string|null, currentVersion:string, now=new Date()):EditorialState {
  if (!approvedVersion) return 'draft'
  if (approvedVersion!==currentVersion) return 'review-pending'
  if (!publishedAt) return 'approved'
  return publishedAt.getTime()>now.getTime()?'scheduled':'public'
}
