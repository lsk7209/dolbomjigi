import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { assertLocalDraftDb } from './local-draft-guard.mjs'

const directory=path.resolve('.tmp')
if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) throw new Error('No symlink draft directory')
fs.mkdirSync(directory,{recursive:true})
const url=assertLocalDraftDb()
if (fs.existsSync(url.slice(5))) throw new Error('Existing test DB preserved; choose a fresh draft filename')
const client=createClient({url})
try {
  for (const file of fs.readdirSync('drizzle').filter(f=>/^\d+.*\.sql$/.test(f)).sort()) await client.executeMultiple(fs.readFileSync(path.join('drizzle',file),'utf8'))
  console.log('Local test schema created; no production connection or seed')
} finally {client.close()}
