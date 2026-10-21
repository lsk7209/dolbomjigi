// Local SQLite only. This tool never reads application DB configuration.
import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';
import { lstat, open, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localDir = path.join(root, '.goal-harness', 'local-data');
const fixed = {
  blog_posts: { 'lovot-real-user-experience': ['title_ko', 'summary', 'body_md'], 'hyodol-monthly-fee-breakdown': ['title_ko', 'summary', 'body_md'], 'hyodol-vs-dasom-comparison': ['title_ko', 'summary', 'body_md'] },
  guides: { 'mom-living-alone': ['title_ko', 'body_md', 'recommended_robots_json'], 'welfare-center-coordinator': ['title_ko', 'body_md', 'recommended_robots_json'] },
  comparisons: { 'lovot-vs-moflin': ['title_ko', 'summary', 'pros_a_json', 'pros_b_json', 'recommended_persona'] },
  robots: Object.fromEntries(['hyodol', 'dasom-k', 'dasom-b', 'dasom-m', 'kkumdoli', 'bomi', 'raemi', 'maibom', 'aibo', 'lovot', 'moflin', 'elliq', 'paro'].map((slug) => [slug, ['price_min', 'price_max', 'subscription_monthly', 'description_short', 'features_json', ...(slug === 'moflin' ? ['manufacturer', 'release_year'] : []), ...(['hyodol', 'dasom-k', 'dasom-b', 'dasom-m', 'kkumdoli', 'bomi', 'raemi', 'maibom', 'paro'].includes(slug) ? ['release_year'] : []), ...(['kkumdoli', 'bomi', 'raemi', 'maibom'].includes(slug) ? ['manufacturer'] : [])]])),
};
const expectedCount = 19;
const hash = (row) => {
  const semantic = Object.fromEntries(Object.entries(row).filter(([key]) => !['created_at', 'updated_at'].includes(key)).sort(([a], [b]) => a.localeCompare(b)));
  return createHash('sha256').update(JSON.stringify(semantic)).digest('hex');
};

function parse(args) {
  const options = { apply: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') options.apply = true;
    else if (args[i] === '--db' && args[i + 1]) options.db = args[++i];
    else if (args[i] === '--plan' && args[i + 1]) options.plan = args[++i];
    else if (args[i] === '--confirm-path' && args[i + 1]) options.confirmPath = args[++i];
    else if (args[i] === '--confirm-domain' && args[i + 1]) options.confirmDomain = args[++i];
    else throw new Error(`Unknown or incomplete argument: ${args[i]}`);
  }
  if (!options.db) throw new Error('Provide --db with an existing local SQLite file');
  return options;
}

async function validateDb(input) {
  if (/^[a-z]+:\/\//i.test(input) || input.startsWith('file:')) throw new Error('Only a filesystem SQLite path is allowed');
  const candidate = path.resolve(root, input);
  if (path.extname(candidate).toLowerCase() !== '.db' || path.relative(localDir, candidate).startsWith('..') || path.relative(localDir, candidate) === '' || path.isAbsolute(path.relative(localDir, candidate))) throw new Error('Database must be an existing .db inside .goal-harness/local-data');
  for (let current = candidate; current !== root; current = path.dirname(current)) {
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error('Symlink target rejected');
  }
  const resolved = await realpath(candidate);
  if (resolved !== candidate) throw new Error('Resolved database path differs from requested path');
  const handle = await open(candidate, 'r');
  try {
    const header = Buffer.alloc(16);
    await handle.read(header, 0, 16, 0);
    if (header.toString() !== 'SQLite format 3\0') throw new Error('Target is not SQLite');
  } finally { await handle.close(); }
  return candidate;
}

function validatePlan(plan) {
  if (plan.version !== 1 || plan.domain !== 'dolbomjigi.ehon365.kr' || plan.rowCap !== expectedCount || plan.rows.length !== expectedCount) throw new Error('Unexpected plan identity or count');
  const seen = new Set();
  for (const row of plan.rows) {
    const allowed = fixed[row.table]?.[row.slug];
    const key = `${row.table}/${row.slug}`;
    if (!allowed || seen.has(key) || !Number.isSafeInteger(row.id) || row.id < 1 || !/^[a-f0-9]{64}$/.test(row.beforeHash) || !/^[a-f0-9]{64}$/.test(row.afterHash)) throw new Error(`Invalid plan row: ${key}`);
    const fields = Object.keys(row.fields);
    if (fields.length !== allowed.length || fields.some((field) => !allowed.includes(field))) throw new Error(`Invalid field allowlist: ${key}`);
    for (const item of Object.values(row.fields)) if (!item || !Object.hasOwn(item, 'before') || !Object.hasOwn(item, 'after')) throw new Error(`Invalid field values: ${key}`);
    seen.add(key);
  }
  if (seen.size !== Object.values(fixed).reduce((n, table) => n + Object.keys(table).length, 0)) throw new Error('Incomplete plan');
}

async function inspect(connection, plan) {
  const states = [];
  for (const item of plan.rows) {
    const result = await connection.execute({ sql: `SELECT * FROM ${item.table} WHERE id = ? AND slug = ?`, args: [item.id, item.slug] });
    if (result.rows.length !== 1) throw new Error(`Missing or duplicate ID/slug: ${item.table}/${item.id}/${item.slug}`);
    const row = { ...result.rows[0] };
    const actual = hash(row);
    const state = actual === item.beforeHash ? 'pending' : actual === item.afterHash ? 'already_applied' : 'conflict';
    states.push({ item, state, actual });
  }
  return states;
}

async function main() {
  const options = parse(process.argv.slice(2));
  const target = await validateDb(options.db);
  const planPath = options.plan ? path.resolve(root, options.plan) : path.join(root, 'docs/trust-20261020/data-plan.json');
  if (options.plan && (path.relative(localDir, planPath).startsWith('..') || path.isAbsolute(path.relative(localDir, planPath)) || (await lstat(planPath)).isSymbolicLink())) throw new Error('Alternate plans must be regular files in .goal-harness/local-data');
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  validatePlan(plan);
  if (options.apply && (options.confirmPath !== target || options.confirmDomain !== plan.domain)) throw new Error(`Apply requires --confirm-path "${target}" --confirm-domain ${plan.domain}`);
  const db = createClient({ url: `file:${target}` });
  try {
    const initial = await inspect(db, plan);
    const conflicts = initial.filter((entry) => entry.state === 'conflict');
    const pending = initial.filter((entry) => entry.state === 'pending');
    console.log(JSON.stringify({ mode: options.apply ? 'apply' : 'dry-run', target, domain: plan.domain, counts: { rows: initial.length, pending: pending.length, alreadyApplied: initial.length - pending.length - conflicts.length, conflicts: conflicts.length, fieldsPending: pending.reduce((n, entry) => n + Object.keys(entry.item.fields).length, 0), evidenceReferences: plan.rows.reduce((n, item) => n + item.evidence.length, 0) }, changes: initial.map(({ item, state }) => ({ table: item.table, id: item.id, slug: item.slug, state, fields: item.fields, evidence: item.evidence })) }, null, 2));
    if (conflicts.length) throw new Error(`Semantic row conflict: ${conflicts.map(({ item }) => `${item.table}/${item.slug}`).join(', ')}`);
    if (!options.apply || !pending.length) return;
    const backup = `${target}.trust-${Date.now()}.bak`;
    await db.execute({ sql: 'VACUUM INTO ?', args: [backup] });
    const tx = await db.transaction('write');
    try {
      const current = await inspect(tx, plan);
      if (current.some((entry, i) => entry.state !== initial[i].state)) throw new Error('Database changed since preflight; no rows updated');
      for (const { item, state } of current) {
        if (state !== 'pending') continue;
        const fields = Object.keys(item.fields);
        await tx.execute({ sql: `UPDATE ${item.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ? AND slug = ?`, args: [...fields.map((field) => item.fields[field].after), item.id, item.slug] });
      }
      const final = await inspect(tx, plan);
      if (final.some((entry) => entry.state !== 'already_applied')) throw new Error('Post-update verification failed');
      await tx.commit();
      console.log(JSON.stringify({ applied: pending.length, backup }));
    } catch (error) { await tx.rollback(); throw error; }
  } finally { await db.close(); }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
