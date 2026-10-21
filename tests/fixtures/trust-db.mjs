// Test-only SQLite operations run in a child process so Windows releases native
// statement handles before the parent removes its temporary test directory.
import {readFile,readdir} from 'node:fs/promises'
import path from 'node:path'
import {createClient} from '@libsql/client'
const [command,input]=process.argv.slice(2)
const localRoot=path.resolve('.goal-harness/local-data')
const target=path.resolve(input??'')
const relative=path.relative(localRoot,target)
if(!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Test DB must be task-local')
const client=createClient({url:`file:${target}`})
try {
  if(command==='create') {
    for(const file of (await readdir('drizzle')).filter(f=>/^\d+.*\.sql$/.test(f)).sort()) {
      await client.executeMultiple(await readFile(`drizzle/${file}`,'utf8'))
    }
    await client.execute('PRAGMA foreign_keys = OFF')
    const fixture=JSON.parse(await readFile(new URL('./trust-rows.json',import.meta.url),'utf8'))
    for(const {table,row} of fixture) {
      const keys=Object.keys(row)
      await client.execute({sql:`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,args:keys.map(k=>row[k])})
    }
  } else if(command==='dump') {
    const result={}
    for(const table of ['blog_posts','guides','comparisons','robots']) result[table]=(await client.execute(`SELECT * FROM ${table} ORDER BY id`)).rows
    console.log(JSON.stringify(result))
  } else if(command==='conflict') {
    await client.execute("UPDATE robots SET description_short = 'concurrent edit' WHERE id = 1 AND slug = 'hyodol'")
  } else throw new Error('Unknown fixture operation')
} finally {client.close()}
