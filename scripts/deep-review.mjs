import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'output', 'dolbomjigi', 'new-content');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const APPROVALS_PATH = path.join(ROOT, 'src', 'content', 'publication-approvals.json');
const SEED_PATH = path.join(ROOT, 'src', 'db', 'seed', 'blog_posts.ts');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'blog-ai', 'posts');

// 금지어 목록
const FORBIDDEN_MEDICAL = [
  '치료', '진단', '의료기기', '효능', '치매 예방', '치매예방',
  '치료 효과', '효능 보장', '약효', '임상 결과 조작', '의사 추천',
  '만병통치', 'FDA 승인', '100% 효과', '100% 안전', '즉시 효과'
];
const FORBIDDEN_PROMOTIONAL = [
  '최고의', '1등 추천', '무조건 추천', '강력 추천', '후회 없는', '단 한 번뿐', '후회없는'
];

export function lintText(text) {
  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/의료기기(?:가|는)?\s*아닙니다/g, '')
    .replace(/치료\s*효과(?:를|는)?\s*보장하지\s*않습니다/g, '');
  const medical = FORBIDDEN_MEDICAL.filter((term) => cleaned.includes(term));
  const promotional = FORBIDDEN_PROMOTIONAL.filter((term) => cleaned.includes(term));
  return {
    ok: medical.length === 0 && promotional.length === 0,
    violations: { medical, promotional }
  };
}

export function contentVersion(content) {
  const ignored = new Set([
    'updated_at', 'content_updated_at', 'source_checked_at',
    'expert_reviewed_at', 'last_seen', 'published_at', 'created_at'
  ]);
  const entries = Object.entries(content)
    .filter(([key]) => !ignored.has(key))
    .sort(([a], [b]) => a.localeCompare(b));
  return crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(entries))).digest('hex');
}

export async function runDeepReview() {
  console.log('🔍 [심층 리뷰 엔진] 전체 콘텐츠 및 사이트 무결성 다각도 검토 시작');
  
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const approvals = JSON.parse(fs.readFileSync(APPROVALS_PATH, 'utf8'));
  const seedContent = fs.readFileSync(SEED_PATH, 'utf8');

  // 매니페스트 + 시드 데이터 전체 슬러그 집합 (SSOT)
  const seedSlugs = [...seedContent.matchAll(/slug:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const publishedSlugs = new Set([...manifest.items.map((i) => i.slug), ...seedSlugs]);
  const approvalMap = new Map(approvals.map((a) => [a.values?.slug, a]));

  const results = {
    totalPosts: manifest.items.length,
    characterIssues: [],
    answerBlockIssues: [],
    lintIssues: [],
    imageMissing: [],
    brokenInternalBlogLinks: [],
    approvalHashMismatches: [],
    seedMissing: [],
    structuralGaps: []
  };

  for (const item of manifest.items) {
    const slug = item.slug;
    const postDir = path.join(ROOT, item.output_path);

    if (!fs.existsSync(postDir)) {
      results.structuralGaps.push({ slug, error: '디렉터리 누락' });
      continue;
    }

    const articlePath = path.join(postDir, 'article.md');

    if (!fs.existsSync(articlePath)) {
      results.structuralGaps.push({ slug, error: 'article.md 누락' });
      continue;
    }

    const bodyMd = fs.readFileSync(articlePath, 'utf8');

    // 1. 글자 수 검토 (최소 3,500자)
    if (bodyMd.length < 3500) {
      results.characterIssues.push({ slug, length: bodyMd.length });
    }

    // 2. AnswerBlock 검토 (최대 300자 이내)
    const answerMatch = bodyMd.match(/<AnswerBlock>([\s\S]*?)<\/AnswerBlock>/);
    if (!answerMatch) {
      results.answerBlockIssues.push({ slug, error: 'AnswerBlock 누락' });
    } else {
      const answerLen = answerMatch[1].trim().length;
      if (answerLen > 300) {
        results.answerBlockIssues.push({ slug, length: answerLen, warning: 'AnswerBlock 권장 길이(250자) 초과' });
      }
    }

    // 3. 금지어 검토
    const lint = lintText(bodyMd);
    if (!lint.ok) {
      results.lintIssues.push({ slug, violations: lint.violations });
    }

    // 4. 대표 이미지 파일 실존 검토
    const imgFile = path.join(IMAGES_DIR, `${slug}.jpg`);
    if (!fs.existsSync(imgFile)) {
      results.imageMissing.push({ slug, expectedFile: `${slug}.jpg` });
    }

    // 5. 본문 내부 블로그 링크 정합성 검토 (/blog/<target-slug>)
    const linkMatches = [...bodyMd.matchAll(/\[.*?\]\((\/blog\/[a-zA-Z0-9-]+)\)/g)];
    for (const match of linkMatches) {
      const targetSlug = match[1].replace('/blog/', '');
      if (!publishedSlugs.has(targetSlug)) {
        results.brokenInternalBlogLinks.push({ from: slug, targetSlug, link: match[1] });
      }
    }

    // 6. 승인 해시 정합성 검토
    const approval = approvalMap.get(slug);
    if (!approval) {
      results.approvalHashMismatches.push({ slug, error: '승인 레코드 누락' });
    } else {
      const expectedVersion = contentVersion(approval.values);
      if (approval.version !== expectedVersion) {
        results.approvalHashMismatches.push({ slug, recorded: approval.version, calculated: expectedVersion });
      }
    }

    // 7. 시드 데이터 포함 여부 검토
    if (!seedContent.includes(`slug: "${slug}"`) && !seedContent.includes(`slug: '${slug}'`)) {
      results.seedMissing.push(slug);
    }
  }

  console.log('\n📊 [심층 리뷰 종합 결과 보고서]');
  console.log(`- 전체 검토 콘텐츠 수: ${results.totalPosts}건`);
  console.log(`- 글자 수 미달 (3,500자 미만): ${results.characterIssues.length}건`);
  console.log(`- AnswerBlock 결함/경고: ${results.answerBlockIssues.length}건`);
  console.log(`- 의료/표시광고법 금지어 위반: ${results.lintIssues.length}건`);
  console.log(`- 대표 이미지 누락: ${results.imageMissing.length}건`);
  console.log(`- 깨진 내부 블로그 링크 (/blog/...): ${results.brokenInternalBlogLinks.length}건`);
  console.log(`- 승인 해시 불일치: ${results.approvalHashMismatches.length}건`);
  console.log(`- 시드(blog_posts.ts) 누락: ${results.seedMissing.length}건`);

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('deep-review.mjs')) {
  runDeepReview().catch(console.error);
}
