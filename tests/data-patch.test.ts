import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import capturedFixture from './fixtures/trust-rows.json'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixtureRows = capturedFixture as unknown as {table:string;row:Record<string,string|number|null>}[]
const planPath = path.join(root, 'docs/trust-20261020/data-plan.json')
const domain = 'dolbomjigi.ehon365.kr'
const sum = (data: Buffer) => createHash('sha256').update(data).digest('hex')

async function workspace() {
  await mkdir(path.join(root, '.goal-harness/local-data'), {recursive:true})
  const dir = await mkdtemp(path.join(root, '.goal-harness/local-data/trust-test-'))
  const db = path.join(dir, 'fixture.db')
  fixtureOperation('create',db)
  return { dir, db }
}

function fixtureOperation(command:string,db:string) {
  const result=spawnSync(process.execPath,[path.join(root,'tests/fixtures/trust-db.mjs'),command,db],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})
  assert.equal(result.status,0,result.stderr)
  return result.stdout
}

function run(args: string[]) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/trust-data.mjs'), ...args], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: 'test' },
  })
}

test('dry-run leaves SQLite bytes unchanged and reports exact planned scope', async () => {
  const { dir, db } = await workspace()
  try {
    const before = sum(await readFile(db))
    const result = run(['--db', db])
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.counts.rows, 19)
    assert.equal(report.counts.pending, 19)
    assert.equal(report.counts.conflicts, 0)
    assert.equal(report.counts.fieldsPending, 100)
    assert.equal(sum(await readFile(db)), before)
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) }
})

test('apply uses exact path and domain, then reruns without changes', async () => {
  const { dir, db } = await workspace()
  try {
    const denied = run(['--db', db, '--apply', '--confirm-domain', domain])
    assert.notEqual(denied.status, 0)
    const apply = run(['--db', db, '--apply', '--confirm-path', db, '--confirm-domain', domain])
    assert.equal(apply.status, 0, apply.stderr)
    const report = JSON.parse(apply.stdout.slice(apply.stdout.lastIndexOf('\n{') + 1))
    assert.equal(report.applied, 19)
    const backup=JSON.parse(fixtureOperation('dump',report.backup))
      for (const table of ['blog_posts', 'guides', 'comparisons', 'robots']) {
        const expected=fixtureRows.filter(item=>item.table===table).map(item=>item.row).sort((a,b)=>Number(a.id)-Number(b.id))
        assert.deepEqual(backup[table],expected)
      }
    const after = sum(await readFile(db))
    const again = run(['--db', db, '--apply', '--confirm-path', db, '--confirm-domain', domain])
    assert.equal(again.status, 0, again.stderr)
    assert.equal(sum(await readFile(db)), after)
    const review = run(['--db', db])
    assert.equal(JSON.parse(review.stdout).counts.alreadyApplied, 19)
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) }
})

test('one altered row blocks the entire patch', async () => {
  const { dir, db } = await workspace()
  try {
    fixtureOperation('conflict',db)
    const before = sum(await readFile(db))
    const result = run(['--db', db, '--apply', '--confirm-path', db, '--confirm-domain', domain])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Semantic row conflict/)
    assert.equal(sum(await readFile(db)), before)
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) }
})

test('unknown field and unsafe paths are rejected', async () => {
  const { dir, db } = await workspace()
  try {
    const plan = JSON.parse(await readFile(planPath, 'utf8'))
    plan.rows[0].fields.published_at = { before: null, after: null }
    const invalid = path.join(dir, 'invalid-plan.json')
    await writeFile(invalid, JSON.stringify(plan))
    const field = run(['--db', db, '--plan', invalid])
    assert.notEqual(field.status, 0)
    assert.match(field.stderr, /Invalid field allowlist/)
    assert.notEqual(run(['--db', 'https://example.com/db']).status, 0)
    assert.notEqual(run(['--db', planPath]).status, 0)
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) }
})
