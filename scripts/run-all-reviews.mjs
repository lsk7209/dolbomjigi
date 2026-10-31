import fs from 'node:fs';
import path from 'node:path';
import { reviewContent, refineContent } from './content-reviewer.mjs';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'output', 'dolbomjigi', 'new-content');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
console.log(`📋 [전체 콘텐츠 리뷰 시작] 총 ${manifest.items.length}개 대상 정밀 진단`);

let excellentCount = 0;
let goodCount = 0;
let needsImprovementCount = 0;
let refinedCount = 0;

for (const item of manifest.items) {
  const dir = path.join(ROOT, item.output_path);
  if (!fs.existsSync(dir)) continue;

  const metaFile = path.join(dir, 'metadata.json');
  const articleFile = path.join(dir, 'article.md');
  const qaFile = path.join(dir, 'qa.json');
  if (!fs.existsSync(metaFile) || !fs.existsSync(articleFile)) continue;

  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  let bodyMd = fs.readFileSync(articleFile, 'utf8');

  // 자동 개선 점검
  const refined = refineContent({ ...meta, body_md: bodyMd });
  if (refined.refinement_applied) {
    bodyMd = refined.body_md;
    fs.writeFileSync(articleFile, bodyMd.trim() + '\n', 'utf8');
    refinedCount++;
  }

  const review = reviewContent({ ...meta, body_md: bodyMd });

  if (review.grade === 'EXCELLENT') excellentCount++;
  else if (review.grade === 'GOOD') goodCount++;
  else needsImprovementCount++;

  // qa.json 갱신
  let qaData = {};
  if (fs.existsSync(qaFile)) {
    try { qaData = JSON.parse(fs.readFileSync(qaFile, 'utf8')); } catch {}
  }
  qaData.review_report = {
    score: review.score,
    grade: review.grade,
    reviewed_at: review.reviewed_at,
    metrics: review.metrics,
    issues: review.issues,
    improvements: review.improvements
  };
  qaData.qa_score = review.score;
  fs.writeFileSync(qaFile, JSON.stringify(qaData, null, 2) + '\n', 'utf8');

  const statusMark = review.score >= 95 ? '🌟' : review.score >= 85 ? '✅' : '⚠️';
  console.log(`  ${statusMark} [${review.score}점/${review.grade}] ${item.slug}`);
}

console.log('\n======================================================');
console.log('📊 [전체 리뷰 통계 결과]');
console.log(`- 총 진단 대상: ${manifest.items.length}편`);
console.log(`- EXCELLENT (95점 이상): ${excellentCount}편`);
console.log(`- GOOD (85~94점): ${goodCount}편`);
console.log(`- NEEDS IMPROVEMENT: ${needsImprovementCount}편`);
console.log(`- 자동 개선(Refinement) 적용: ${refinedCount}편`);
console.log('======================================================\n');
