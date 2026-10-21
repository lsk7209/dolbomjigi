import path from 'node:path'
import fs from 'node:fs'
export function assertLocalDraft(url?:string) {
  const name=process.env.DOLBOM_LOCAL_DRAFT_DB
  if (!name || !/^[A-Za-z0-9][A-Za-z0-9_-]*\.db$/.test(name) || url!==`file:./.tmp/${name}`) throw new Error('Explicit local draft DB required; remote mutation is blocked')
  const dir=path.resolve('.tmp'), file=path.join(dir,name)
  if (!fs.existsSync(dir) || fs.lstatSync(dir).isSymbolicLink() || (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink())) throw new Error('Local draft must use a real .tmp path')
}
