import revisions from '@/content/revisions.json'

const blogRevisions = revisions as Record<string, string>

/** Apply editorial corrections only after publication has checked the raw DB row.
 * These source-controlled corrections are not evidence of human review.
 */
export function presentBlogRevision<T extends { slug: string; title_ko: string }>(post: T): T {
  // Manuscripts remain preview-only until a separate human-reviewed release.
  if (process.env.NEXT_PUBLIC_LOCAL_PREVIEW !== '1') return post
  const source = blogRevisions[`/blog/${post.slug}`]
  if (!source) return post

  const article = source.split(/^## editorial-note\//m, 1)[0].trim()
  const match = article.match(/^## (.+)\r?\n\r?\n([\s\S]*)$/)
  if (!match) throw new Error(`Invalid blog revision: ${post.slug}`)

  const [, title_ko, body_md] = match
  const summary = body_md.split(/\r?\n\s*\r?\n/, 1)[0].trim()
  if (!summary) throw new Error(`Missing blog revision summary: ${post.slug}`)

  return {
    ...post,
    title_ko: title_ko.trim(),
    ...('summary' in post ? { summary } : {}),
    ...('subtitle' in post ? { subtitle: null } : {}),
    ...('body_md' in post ? { body_md: body_md.trim() } : {}),
  } as T
}
