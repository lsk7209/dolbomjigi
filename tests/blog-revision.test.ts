import assert from 'node:assert/strict'
import test from 'node:test'
import { presentBlogRevision } from '../src/lib/blog-revision'
const previousPreview=process.env.NEXT_PUBLIC_LOCAL_PREVIEW
process.env.NEXT_PUBLIC_LOCAL_PREVIEW='1'
test.after(()=>{
  if(previousPreview===undefined) delete process.env.NEXT_PUBLIC_LOCAL_PREVIEW
  else process.env.NEXT_PUBLIC_LOCAL_PREVIEW=previousPreview
})

test('unapproved manuscript corrections are never activated in production',()=>{
  delete process.env.NEXT_PUBLIC_LOCAL_PREVIEW
  try {
    const raw={slug:'lovot-real-user-experience',title_ko:'stored title',body_md:'stored body'}
    assert.equal(presentBlogRevision(raw),raw)
  } finally {process.env.NEXT_PUBLIC_LOCAL_PREVIEW='1'}
})

test('the three priority blog revisions replace legacy presentation copy without mutating the raw row', () => {
  const expected = new Map([
    ['lovot-real-user-experience', 'LOVOT 실제 사용 후기 찾기 전에 확인할 것'],
    ['hyodol-monthly-fee-breakdown', '효돌 월 이용료: 지금 공개 자료만으로 얼마라고 쓸 수 있을까?'],
    ['hyodol-vs-dasom-comparison', '효돌과 다솜 비교: 제품 이름보다 먼저 확인해야 할 근거'],
  ])
  for (const [slug, title] of expected) {
    const raw = { slug, title_ko: '검증되지 않은 기존 제목', summary: '기존 요약', subtitle: '기존 부제', body_md: '기존 본문', id: 42 }
    const shown = presentBlogRevision(raw)
    assert.equal(shown.title_ko, title)
    assert.notEqual(shown.summary, raw.summary)
    assert.ok(shown.summary?.length)
    assert.equal(shown.subtitle, null)
    assert.ok(shown.body_md.includes(shown.summary!))
    assert.ok(!shown.body_md.startsWith('## ' + title))
    assert.equal(shown.id, raw.id)
    assert.equal(raw.title_ko, '검증되지 않은 기존 제목')
    assert.equal(raw.body_md, '기존 본문')
  }
})

test('internal editorial notes do not appear in public body or summary', () => {
  const shown = presentBlogRevision({ slug: 'hyodol-vs-dasom-comparison', title_ko: 'legacy', summary: 'legacy', body_md: 'legacy' })
  assert.doesNotMatch(shown.body_md, /editorial-note|제품 정보 표기 원칙/)
  assert.doesNotMatch(shown.summary, /editorial-note|제품 정보 표기 원칙/)
})

test('unrevised posts retain their original object and projected fields stay projected', () => {
  const raw = { slug: 'unrevised', title_ko: 'original', summary: null }
  assert.equal(presentBlogRevision(raw), raw)
  const projected = presentBlogRevision({ slug: 'lovot-real-user-experience', title_ko: 'legacy' })
  assert.equal('body_md' in projected, false)
  assert.equal('summary' in projected, false)
})
