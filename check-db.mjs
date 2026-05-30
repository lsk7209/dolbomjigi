import { createClient } from '@libsql/client';
import { createClient as createWebClient } from '@libsql/client/web';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env.local');
const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
for (const line of lines) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const url = process.env.TURSO_DATABASE_URL;
const httpsUrl = url.replace('libsql://', 'https://');
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('URL (raw):', url);
console.log('URL (https):', httpsUrl);

// Node client
console.log('\n--- @libsql/client (Node) ---');
const nodeClient = createClient({ url, authToken });
const nodeResult = await nodeClient.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log('Tables:', nodeResult.rows.map(x => x[0]).join(', '));
nodeClient.close();

// Web client with https://
console.log('\n--- @libsql/client/web (https://) ---');
const webClient = createWebClient({ url: httpsUrl, authToken });
const webResult = await webClient.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log('Tables:', webResult.rows.map(x => x[0]).join(', '));
