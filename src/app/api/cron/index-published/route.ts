/**
 * Vercel Cron — recently published blog URLs indexing ping
 *
 * Schedule: every 5 hours, shortly after scheduled blog publish slots.
 * Auth:     Authorization: Bearer {CRON_SECRET}
 *
 * GET /api/cron/index-published
 */

import { NextRequest, NextResponse } from 'next/server'
import { and, desc, gte, lte } from 'drizzle-orm'

import { db } from '@/db/client'
import { blogPosts } from '@/db/schema'
import { SITE_URL } from '@/lib/config'
import { pingGscSitemap, pingIndexNow } from '@/lib/index-ping'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DEFAULT_WINDOW_HOURS = 6
const MAX_URLS_PER_RUN = 25

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowHoursParam = Number(request.nextUrl.searchParams.get('windowHours'))
  const windowHours =
    Number.isFinite(windowHoursParam) && windowHoursParam > 0
      ? Math.min(windowHoursParam, 24)
      : DEFAULT_WINDOW_HOURS
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

  const recentPosts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title_ko,
      publishedAt: blogPosts.published_at,
    })
    .from(blogPosts)
    .where(and(gte(blogPosts.published_at, since), lte(blogPosts.published_at, now)))
    .orderBy(desc(blogPosts.published_at))
    .limit(MAX_URLS_PER_RUN)

  const urls = recentPosts.map((post) => `${SITE_URL}/blog/${post.slug}`)

  if (urls.length === 0) {
    return NextResponse.json({
      ok: true,
      indexed: 0,
      windowHours,
      urls,
      indexNow: { ok: true, skipped: true, reason: 'no recently published posts' },
      gsc: { ok: true, skipped: true, reason: 'no recently published posts' },
    })
  }

  const [indexNowResult, gscResult] = await Promise.allSettled([
    pingIndexNow(urls),
    pingGscSitemap(),
  ])

  return NextResponse.json({
    ok: true,
    indexed: urls.length,
    windowHours,
    urls,
    posts: recentPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString(),
    })),
    indexNow:
      indexNowResult.status === 'fulfilled'
        ? indexNowResult.value
        : { ok: false, error: String(indexNowResult.reason) },
    gsc:
      gscResult.status === 'fulfilled'
        ? gscResult.value
        : { ok: false, error: String(gscResult.reason) },
  })
}
