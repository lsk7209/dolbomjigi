/**
 * 블로그 생성 결과(JSON)를 Turso blog_posts에 적재한다.
 * - scripts/blog-generated-*.json 전부 읽기
 * - published_at = BASE + index * 5시간 (예약 공개)
 * - content-linter로 의료표현 검사 후 적재 (위반 글 제외·리포트)
 *
 * 실행: pnpm tsx src/db/seed/blog_import.ts
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../schema';
import { blogPosts } from '../schema';
import { eq } from 'drizzle-orm';
import { lintContent } from '../../lib/content-linter';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

interface GeneratedPost {
  slug: string;
  title: string;
  subtitle?: string;
  summary?: string;
  body_md: string;
  category: 'care_info' | 'product_review' | 'support_program' | 'guide' | 'news';
  target_persona: 'family_caregiver' | 'social_worker' | 'public_servant' | 'institution' | 'all';
  tags?: string[];
  reading_time_minutes?: number;
  quality_score?: number;
  pass?: boolean;
}

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL 미설정');

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  // scripts/blog-generated-*.json 수집
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const files = fs
    .readdirSync(scriptsDir)
    .filter((f) => /^blog-generated.*\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    console.error('❌ scripts/blog-generated-*.json 파일이 없습니다.');
    process.exit(1);
  }

  const posts: GeneratedPost[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(scriptsDir, f), 'utf-8');
    const parsed = JSON.parse(raw);
    const arr: GeneratedPost[] = Array.isArray(parsed) ? parsed : parsed.results ?? [];
    posts.push(...arr);
    console.log(`📄 ${f}: ${arr.length}개 로드`);
  }

  console.log(`\n총 ${posts.length}개 글 적재 대상\n`);

  // 기존 마지막 published_at 이후부터 예약 (없으면 지금부터)
  const existing = await db
    .select({ published_at: blogPosts.published_at })
    .from(blogPosts)
    .orderBy(blogPosts.published_at);
  const now = Date.now();
  const lastFuture = existing
    .map((r) => (r.published_at ? new Date(r.published_at).getTime() : 0))
    .reduce((max, t) => Math.max(max, t), now);
  // 이미 예약된 미래글이 있으면 그 다음부터, 없으면 지금부터
  const baseEpoch = lastFuture > now ? lastFuture + FIVE_HOURS_MS : now;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let lintFailed = 0;
  let scheduleIdx = 0;

  for (const post of posts) {
    // 품질 미통과 제외
    if (post.pass === false) {
      console.log(`  ⏭️  품질 미통과 제외: ${post.slug} (${post.quality_score ?? '?'}점)`);
      skipped++;
      continue;
    }

    // content-linter 의료표현 검사
    const lint = lintContent(post.body_md);
    if (lint.violations.medical.length > 0) {
      console.log(`  🚫 의료표현 위반 제외: ${post.slug} — ${lint.violations.medical.join(', ')}`);
      lintFailed++;
      continue;
    }

    // slug 존재 시 UPDATE (published_at 보존 — 예약 스케줄 유지), 신규면 INSERT
    const dup = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, post.slug))
      .limit(1);

    if (dup.length > 0) {
      await db
        .update(blogPosts)
        .set({
          title_ko: post.title,
          subtitle: post.subtitle ?? null,
          summary: post.summary ?? null,
          body_md: post.body_md,
          category: post.category,
          target_persona: post.target_persona,
          tags_json: post.tags ? JSON.stringify(post.tags) : null,
          reading_time_minutes: post.reading_time_minutes ?? null,
          updated_at: new Date(),
        })
        .where(eq(blogPosts.slug, post.slug));
      console.log(`  ♻️  본문 갱신 (예약일 보존): ${post.slug}`);
      updated++;
      continue;
    }

    const publishedAt = new Date(baseEpoch + scheduleIdx * FIVE_HOURS_MS);

    await db.insert(blogPosts).values({
      slug: post.slug,
      title_ko: post.title,
      subtitle: post.subtitle ?? null,
      summary: post.summary ?? null,
      body_md: post.body_md,
      category: post.category,
      target_persona: post.target_persona,
      tags_json: post.tags ? JSON.stringify(post.tags) : null,
      reading_time_minutes: post.reading_time_minutes ?? null,
      author_id: 1,
      published_at: publishedAt,
    });

    console.log(`  ✓ ${post.slug} → 공개 예정 ${publishedAt.toISOString()}`);
    inserted++;
    scheduleIdx++;
  }

  console.log(`\n✅ 완료: ${inserted}개 신규, ${updated}개 갱신, ${skipped}개 스킵, ${lintFailed}개 의료표현 위반 제외`);
  if (inserted > 0) {
    const first = new Date(baseEpoch);
    const last = new Date(baseEpoch + (scheduleIdx - 1) * FIVE_HOURS_MS);
    console.log(`📅 공개 스케줄: ${first.toISOString()} ~ ${last.toISOString()} (5시간 간격)`);
  }
  client.close();
}

main().catch((err) => {
  console.error('❌ 적재 실패:', err);
  process.exit(1);
});
