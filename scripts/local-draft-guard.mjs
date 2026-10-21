import fs from 'node:fs'
import path from 'node:path'

/** Legacy mutators may run only against an explicit task-local SQLite draft. */
export function assertLocalDraftDb(url = process.env.TURSO_DATABASE_URL) {
  const name = process.env.DOLBOM_LOCAL_DRAFT_DB
  if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.db$/.test(name)) {
    throw new Error('Set DOLBOM_LOCAL_DRAFT_DB to a task-local .db filename under .tmp')
  }
  const expectedUrl = `file:./.tmp/${name}`
  if (url !== expectedUrl) {
    throw new Error(`Legacy DB mutation requires TURSO_DATABASE_URL=${expectedUrl}; remote and production URLs are blocked`)
  }
  const draftDir = path.join(process.cwd(), '.tmp')
  if (!fs.existsSync(draftDir) || fs.lstatSync(draftDir).isSymbolicLink() || !fs.statSync(draftDir).isDirectory()) {
    throw new Error('Create a real local .tmp directory before running a draft mutator')
  }
  const draftFile = path.join(draftDir, name)
  if (fs.existsSync(draftFile) && (fs.lstatSync(draftFile).isSymbolicLink() || !fs.statSync(draftFile).isFile())) {
    throw new Error('Draft DB must be a regular local file')
  }
  return expectedUrl
}
