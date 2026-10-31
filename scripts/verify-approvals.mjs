import fs from 'node:fs';
import { contentVersion } from './auto-daily-content.mjs';

const approvals = JSON.parse(fs.readFileSync('src/content/publication-approvals.json', 'utf8'));
console.log('Total approved records:', approvals.length);

let errors = 0;
for (const a of approvals) {
  const v = contentVersion(a.values);
  if (v !== a.version) {
    console.error(`Mismatch for ${a.values?.slug}: expected ${v}, got ${a.version}`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`✅ All ${approvals.length} approvals have 100% matching SHA256 contentVersion hashes!`);
} else {
  console.error(`❌ Found ${errors} mismatches.`);
  process.exit(1);
}
