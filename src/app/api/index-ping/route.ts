/**
 * POST /api/index-ping
 * 새 콘텐츠 발행 시 IndexNow + GSC sitemap 재제출
 *
 * Header: x-admin-secret
 * Body:   { urls?: string[] }  — 없으면 sitemap만 재제출
 */

import { NextRequest, NextResponse } from 'next/server'
import { pingIndexNow, pingGscSitemap } from '@/lib/index-ping'
import { SITE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret && request.headers.get('x-admin-secret') !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let urls: string[] = []
  try {
    const body = (await request.json()) as { urls?: string[] }
    urls = body.urls ?? []
  } catch {
    // body 없으면 sitemap만 제출
  }

  // URLs가 없으면 sitemap.xml URL을 IndexNow에 제출
  const indexNowUrls = urls.length > 0 ? urls : [`${SITE_URL}/sitemap.xml`]

  const [indexNowResult, gscResult] = await Promise.allSettled([
    pingIndexNow(indexNowUrls),
    pingGscSitemap(),
  ])

  return NextResponse.json({
    ok: true,
    indexNow: indexNowResult.status === 'fulfilled' ? indexNowResult.value : { ok: false },
    gsc: gscResult.status === 'fulfilled' ? gscResult.value : { ok: false },
    urls: indexNowUrls,
  })
}
