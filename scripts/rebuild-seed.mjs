import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, 'src', 'db', 'seed', 'blog_posts.ts');
const APPROVALS_PATH = path.join(ROOT, 'src', 'content', 'publication-approvals.json');

const rawSeed = fs.readFileSync(SEED_PATH, 'utf8');

// The first 5 posts end after nursing-home-robot-5-checklist
const marker = "slug: 'nursing-home-robot-5-checklist'";
const markerIdx = rawSeed.indexOf(marker);
if (markerIdx === -1) {
  console.error('Could not find nursing-home-robot-5-checklist marker');
  process.exit(1);
}

const endOf5th = rawSeed.indexOf('  },', markerIdx);
if (endOf5th === -1) {
  console.error('Could not find end of 5th post');
  process.exit(1);
}

const staticPart = rawSeed.slice(0, endOf5th + 4).trimEnd(); // exactly ends at '  },'

// Load all 60 approved posts
const approvals = JSON.parse(fs.readFileSync(APPROVALS_PATH, 'utf8'));
const blogPosts = approvals.filter((a) => a.table === 'blog_posts').map((a) => a.values);

console.log(`Building seed with 5 static posts + ${blogPosts.length} approved blog posts`);

let generatedItems = '';
for (const p of blogPosts) {
  const publishedDate = p.published_at ? `new Date(${JSON.stringify(p.published_at)})` : 'new Date()';
  
  let safeTags = p.tags_json;
  try {
    const parsed = typeof safeTags === 'string' ? JSON.parse(safeTags) : safeTags;
    safeTags = JSON.stringify(JSON.stringify(Array.isArray(parsed) ? parsed : [String(parsed)]));
  } catch {
    safeTags = JSON.stringify(JSON.stringify([p.main_keyword || p.slug]));
  }

  generatedItems += `  {
    slug: ${JSON.stringify(p.slug)},
    title_ko: ${JSON.stringify(p.title_ko)},
    subtitle: ${JSON.stringify(p.subtitle || '')},
    summary: ${JSON.stringify(p.summary || '')},
    cover_image_url: ${JSON.stringify(p.cover_image_url || '')},
    body_md: ${JSON.stringify(p.body_md || '')},
    category: ${JSON.stringify(p.category || 'guide')},
    target_persona: ${JSON.stringify(p.target_persona || 'family_caregiver')},
    tags_json: ${safeTags},
    reading_time_minutes: ${p.reading_time_minutes || 5},
    author_id: ${p.author_id || 1},
    published_at: ${publishedDate},
  },
`;
}

const finalCode = staticPart + '\n' + generatedItems + ']\n';

fs.writeFileSync(SEED_PATH, finalCode, 'utf8');
console.log('✅ Rebuilt src/db/seed/blog_posts.ts cleanly!');
