/**
 * 관리자용 콘텐츠 린터 API
 *
 * POST /api/lint
 * Body: { text: string }
 * Header: x-admin-secret: {ADMIN_SECRET}
 *
 * Response: { ok: boolean, violations: { medical: string[], promotional: string[] } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { lintContent } from '@/lib/content-linter';

export const dynamic = 'force-dynamic';

interface LintRequestBody {
  text?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ADMIN_SECRET 헤더 검증
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = request.headers.get('x-admin-secret');

  if (adminSecret) {
    if (!providedSecret || providedSecret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 요청 바디 파싱
  let body: LintRequestBody;
  try {
    body = (await request.json()) as LintRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.text !== 'string') {
    return NextResponse.json(
      { error: '`text` 필드는 문자열이어야 합니다.' },
      { status: 422 }
    );
  }

  if (body.text.length === 0) {
    return NextResponse.json(
      { error: '`text` 필드가 비어 있습니다.' },
      { status: 422 }
    );
  }

  // 콘텐츠 린터 실행
  const result = lintContent(body.text);

  return NextResponse.json(result, { status: 200 });
}
