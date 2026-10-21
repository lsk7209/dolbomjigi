import { and, or, isNull, isNotNull, lte, getTableName, getTableColumns, sql, type AnyColumn } from 'drizzle-orm'
import recordedApprovals from '@/content/publication-approvals.json'
import recordedLegacy from '@/content/legacy-publications.json'
import { contentVersion } from './trust'

// Compatibility boundary: preserve already-public legacy content. Future legacy
// schedules and all new content require an editor-approved exact content version.
export const LEGACY_PUBLIC_CUTOFF = new Date('2026-10-20T14:13:26.762Z')
export interface PublicationApproval { table:string; values:Record<string,unknown>; version:string }
const approvals=recordedApprovals as PublicationApproval[]
export interface LegacyPublication { table:string; id:number; slug:string; publishedAt:number }
const legacyPublications=recordedLegacy as LegacyPublication[]

/** Published content is visible only when its scheduled time has arrived. */
export function isPublicAt(publishedAt: Date | null | undefined, now: Date = new Date(), row?:Record<string,unknown>, table?:string, allowed=approvals, legacy=legacyPublications): publishedAt is Date {
  if (!(publishedAt instanceof Date) || !Number.isFinite(publishedAt.getTime()) || publishedAt>now) return false
  if (!row) return false
  const captured=publishedAt<=LEGACY_PUBLIC_CUTOFF && legacy.some(entry=>entry.table===table && entry.id===row.id && entry.slug===row.slug && entry.publishedAt===publishedAt.getTime()/1000)
  return captured || allowed.some(a=>a.table===table && a.version===contentVersion(row) && a.version===contentVersion(a.values))
}

export function publicAtOrBefore(column: AnyColumn, now: Date = new Date(), allowed=approvals, legacy=legacyPublications) {
  const columns=getTableColumns(column.table)
  const captured=legacy.filter(entry=>entry.table===getTableName(column.table))
  // A single bound JSON manifest avoids hundreds of OR branches/SQL parameters.
  const legacyMatch=captured.length && columns.id && columns.slug
    ? and(lte(column, LEGACY_PUBLIC_CUTOFF), sql`exists (select 1 from json_each(${JSON.stringify(captured)}) as captured where json_extract(captured.value, '$.id') = ${columns.id} and json_extract(captured.value, '$.slug') = ${columns.slug} and json_extract(captured.value, '$.publishedAt') = ${column})`)
    : sql`0`
  const reviewed=allowed.filter(a=>a.table===getTableName(column.table) && a.version===contentVersion(a.values)).map(a=>and(...Object.entries(a.values).filter(([key])=>!['updated_at','published_at','created_at','content_updated_at','source_checked_at','expert_reviewed_at','last_seen'].includes(key)).map(([key,value])=> {
    const field=columns[key]
    if (!field) throw new Error('Approval contains an unknown content field')
    return value===null?isNull(field):sql`${field} = ${typeof value==='boolean'?Number(value):value}`
  })))
  return and(isNotNull(column), lte(column, now), or(legacyMatch, ...reviewed))
}
