import fs from 'node:fs';
import path from 'node:path';

const SEED_PATH = path.join(process.cwd(), 'src', 'db', 'seed', 'blog_posts.ts');
const raw = fs.readFileSync(SEED_PATH, 'utf8');
const lines = raw.split(/\r?\n/);

const fixedLines = lines.map((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('tags_json:')) {
    const cleaned = trimmed
      .replace(/^tags_json:\s*/, '')
      .replace(/,?$/, '')
      .replace(/[\\"[\]]/g, '')
      .trim();
    return `    tags_json: ${JSON.stringify(JSON.stringify([cleaned]))},`;
  }
  return line;
});

fs.writeFileSync(SEED_PATH, fixedLines.join('\n'), 'utf8');
console.log('Successfully normalized all tags_json in seed file.');
