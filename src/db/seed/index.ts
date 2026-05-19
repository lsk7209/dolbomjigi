import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../schema';
import { robots, regions, authors, supportPrograms, guides, comparisons, researchStudies, infoArticles } from '../schema';
import { robotsSeedData } from './robots';
import { regionsSeedData } from './regions';
import { authorsSeedData } from './authors';
import { supportProgramsSeedData } from './support_programs';
import { guidesSeedData } from './guides';
import { comparisonsSeedData } from './comparisons';
import { researchStudiesSeedData } from './research_studies';
import { infoArticlesSeedData } from './info_articles';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local for scripts
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

async function seed() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  // Regions 먼저 삽입 (support_programs에서 FK 참조)
  console.log('📍 Inserting regions...');
  for (const region of regionsSeedData) {
    await db
      .insert(regions)
      .values(region)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${regionsSeedData.length} regions inserted`);

  // Robots 삽입
  console.log('🤖 Inserting robots...');
  for (const robot of robotsSeedData) {
    await db
      .insert(robots)
      .values(robot)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${robotsSeedData.length} robots inserted`);

  // Authors 삽입
  console.log('👤 Inserting authors...');
  for (const author of authorsSeedData) {
    await db
      .insert(authors)
      .values(author)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${authorsSeedData.length} authors inserted`);

  // Support Programs 삽입 (regions & authors FK 참조)
  console.log('🏛️ Inserting support programs...');
  for (const program of supportProgramsSeedData) {
    await db
      .insert(supportPrograms)
      .values(program)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${supportProgramsSeedData.length} support programs inserted`);

  // Guides 삽입 (authors FK 참조)
  console.log('📖 Inserting guides...');
  for (const guide of guidesSeedData) {
    await db
      .insert(guides)
      .values(guide)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${guidesSeedData.length} guides inserted`);

  // Comparisons 삽입 (robots & authors FK 참조)
  console.log('⚖️ Inserting comparisons...');
  for (const comparison of comparisonsSeedData) {
    await db
      .insert(comparisons)
      .values(comparison)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${comparisonsSeedData.length} comparisons inserted`);

  // Research Studies 삽입
  console.log('🔬 Inserting research studies...');
  for (const study of researchStudiesSeedData) {
    await db
      .insert(researchStudies)
      .values(study)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${researchStudiesSeedData.length} research studies inserted`);

  // Info Articles 삽입 (T5 정보 페이지 전용)
  console.log('📰 Inserting info articles...');
  for (const article of infoArticlesSeedData) {
    await db.insert(infoArticles).values(article).onConflictDoNothing();
  }
  console.log(`  ✓ ${infoArticlesSeedData.length} info articles inserted`);

  console.log('✅ Seeding complete!');
  client.close();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
