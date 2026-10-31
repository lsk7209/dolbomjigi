import fs from 'node:fs';
import path from 'node:path';
import { reviewContent } from './content-reviewer.mjs';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'output', 'dolbomjigi', 'new-content');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

let totalChars = 0;
let minChars = Infinity;
let maxChars = -Infinity;
let minCharSlug = '';
let maxCharSlug = '';

let totalAnswerBlockChars = 0;
let answerBlockCount = 0;

let tableCount = 0;
let calloutCount = 0;
let totalFaqCount = 0;
let totalInternalLinks = 0;

let scores = [];
let gradeCounts = { EXCELLENT: 0, GOOD: 0, NEEDS_IMPROVEMENT: 0, POOR: 0 };
let scoreDist = { '100': 0, '95-99': 0, '90-94': 0, '85-89': 0, 'below-85': 0 };

let totalMedicalViolations = 0;
let totalPromoViolations = 0;
let totalCliches = 0;

const itemDetails = [];

for (const item of manifest.items) {
  const dir = path.join(ROOT, item.output_path);
  if (!fs.existsSync(dir)) continue;

  const metaFile = path.join(dir, 'metadata.json');
  const articleFile = path.join(dir, 'article.md');
  if (!fs.existsSync(metaFile) || !fs.existsSync(articleFile)) continue;

  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const bodyMd = fs.readFileSync(articleFile, 'utf8');

  const review = reviewContent({ ...meta, body_md: bodyMd });

  const chars = bodyMd.length;
  totalChars += chars;
  if (chars < minChars) { minChars = chars; minCharSlug = item.slug; }
  if (chars > maxChars) { maxChars = chars; maxCharSlug = item.slug; }

  const ansMatch = bodyMd.match(/<AnswerBlock>([\s\S]*?)<\/AnswerBlock>/);
  if (ansMatch) {
    answerBlockCount++;
    totalAnswerBlockChars += ansMatch[1].trim().length;
  }

  if (review.metrics.has_table) tableCount++;
  if (/>\s*\[!TIP\]|```/.test(bodyMd)) calloutCount++;
  totalFaqCount += review.metrics.faq_count;
  totalInternalLinks += review.metrics.internal_link_count;

  totalMedicalViolations += review.metrics.medical_violation_count;
  totalPromoViolations += review.metrics.promotional_violation_count;
  totalCliches += review.metrics.ai_cliche_count;

  scores.push(review.score);
  gradeCounts[review.grade] = (gradeCounts[review.grade] || 0) + 1;

  if (review.score === 100) scoreDist['100']++;
  else if (review.score >= 95) scoreDist['95-99']++;
  else if (review.score >= 90) scoreDist['90-94']++;
  else if (review.score >= 85) scoreDist['85-89']++;
  else scoreDist['below-85']++;

  itemDetails.push({
    slug: item.slug,
    title: meta.title_ko,
    score: review.score,
    grade: review.grade,
    charCount: chars,
    issues: review.issues
  });
}

const n = manifest.items.length;
const avgChars = Math.round(totalChars / n);
const avgAnswerBlock = Math.round(totalAnswerBlockChars / answerBlockCount);
const avgFaq = (totalFaqCount / n).toFixed(1);
const avgInternalLinks = (totalInternalLinks / n).toFixed(1);
const avgScore = (scores.reduce((a, b) => a + b, 0) / n).toFixed(1);

const summary = {
  totalCount: n,
  avgScore: Number(avgScore),
  gradeCounts,
  scoreDist,
  characterStats: {
    avg: avgChars,
    min: minChars,
    minSlug: minCharSlug,
    max: maxChars,
    maxSlug: maxCharSlug
  },
  structureStats: {
    answerBlockRate: `${((answerBlockCount / n) * 100).toFixed(1)}%`,
    avgAnswerBlockChars: avgAnswerBlock,
    tableRate: `${((tableCount / n) * 100).toFixed(1)}%`,
    calloutRate: `${((calloutCount / n) * 100).toFixed(1)}%`,
    avgFaqCount: Number(avgFaq),
    avgInternalLinks: Number(avgInternalLinks)
  },
  complianceStats: {
    medicalViolations: totalMedicalViolations,
    promotionalViolations: totalPromoViolations,
    aiCliches: totalCliches
  },
  sampleTopPosts: itemDetails.filter(x => x.score === 100).slice(0, 5),
  sampleMinorIssues: itemDetails.filter(x => x.issues.length > 0).slice(0, 5)
};

fs.writeFileSync(path.join(ROOT, 'output', 'dolbomjigi', 'quality-audit-summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log('Quality inspection completed. Output written to output/dolbomjigi/quality-audit-summary.json');
