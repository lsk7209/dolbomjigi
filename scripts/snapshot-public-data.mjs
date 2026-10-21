// Read-only remote SELECTs; never imports the application or seed/migrate code.
import { createClient } from '@libsql/client';
import { mkdir, writeFile } from 'node:fs/promises';
const tables = ['authors','robots','regions','support_programs','program_robots','robot_region_availability','comparisons','guides','research_studies','info_articles','blog_posts'];
const db = createClient({ url:process.env.TURSO_DATABASE_URL, authToken:process.env.TURSO_AUTH_TOKEN });
const snapshot = { capturedAt:new Date().toISOString(), environment:'existing configured DB, treated as production read-only', tables:{} };
try {
  for (const name of tables) {
    const result = await db.execute(`SELECT * FROM ${name} LIMIT 3001`);
    if (result.rows.length>3000) throw new Error('Snapshot limit exceeded');
    snapshot.tables[name]=result.rows;
  }
  await mkdir('.goal-harness/local-data', {recursive:true});
  await writeFile('.goal-harness/local-data/public-snapshot.json',JSON.stringify(snapshot,null,2));
  console.log(JSON.stringify({capturedAt:snapshot.capturedAt, counts:Object.fromEntries(Object.entries(snapshot.tables).map(([k,v])=>[k,v.length]))}));
} catch(e) { console.error('Read-only snapshot failed:', e.code ?? e.name); process.exitCode=1; }
finally { db.close(); }
