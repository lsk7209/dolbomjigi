import fs from 'node:fs';

const target = 'scripts/article-templates/rural-bus-smart-card-care-robot-transfer-check.mjs';
let content = fs.readFileSync(target, 'utf8');

// Replace markdown code fences within the body_md template string
content = content.replace(/(?<!\\)```/g, '\\`\\`\\`');

fs.writeFileSync(target, content, 'utf8');
console.log('Fixed backticks in template!');
