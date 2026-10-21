/** Local editor workflow. Never writes a remote DB or publishes to the live site. */
import fs from 'node:fs'
import { createClient } from '@libsql/client'
import { assertLocalDraft } from '../src/lib/local-draft'
import { reviewDecision, type EditorialEvidence } from '../src/lib/editorial-review'
import { contentVersion } from '../src/lib/trust'

async function main(){
  const args=process.argv.slice(2), value=(key:string)=>args[args.indexOf(key)+1]
  const table=value('--table'), id=Number(value('--id')), evidencePath=value('--evidence')
  if (!['blog_posts','guides','comparisons','info_articles'].includes(table) || !Number.isInteger(id) || id<1 || !args.includes('--evidence')) throw new Error('Exact --table --id --evidence are required')
  const url=process.env.TURSO_DATABASE_URL
  assertLocalDraft(url)
  const client=createClient({url:url!})
  try {
    const result=await client.execute({sql:`SELECT * FROM ${table} WHERE id=?`,args:[id]})
    if(result.rows.length!==1) throw new Error('Expected exactly one draft')
    const row={...result.rows[0]}
    const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8')) as EditorialEvidence
    const decision=reviewDecision(row,evidence)
    console.log(JSON.stringify({mode:args.includes('--apply')?'apply-local-approval':'dry-run',decision,dbWrites:0},null,2))
    if (!decision.approved) {process.exitCode=1;return}
    if (!args.includes('--apply')) return
    // Store semantic fields only. Runtime SQL and body checks compare these exact values.
    const ignored=new Set(['published_at','updated_at','created_at','last_seen','source_checked_at','content_updated_at','expert_reviewed_at'])
    const values=Object.fromEntries(Object.entries(row).filter(([key])=>!ignored.has(key)))
    const filename='src/content/publication-approvals.json'
    const existing=JSON.parse(fs.readFileSync(filename,'utf8')) as {table:string;values:Record<string,unknown>;version:string}[]
    const next=existing.filter(a=>!(a.table===table && a.values.id===id))
    next.push({table,values,version:contentVersion(values)})
    // Approval is versioned in source review; scheduling remains a separate approved data change.
    fs.writeFileSync(filename,JSON.stringify(next,null,2)+'\n')
  } finally {client.close()}
}
main().catch(()=>{console.error('Approval failed; inspect local input and evidence. No remote writes performed.');process.exitCode=1})
