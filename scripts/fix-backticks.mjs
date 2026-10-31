import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'scripts', 'generate-batch8.mjs');
let content = fs.readFileSync(filePath, 'utf8');

const fixed = content.replace(/(?<!\\)```/g, '\\`\\`\\`');

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed backticks in generate-batch8.mjs');
