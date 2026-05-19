import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * Edge runtime 지원을 위해 @libsql/client/web 사용.
 * Node.js 환경(로컬 개발, seed, migrate)에서는 src/db/seed/index.ts 및
 * src/db/migrate.ts가 @libsql/client (node variant)를 직접 사용합니다.
 */
function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

// 싱글턴 패턴 (Node.js 환경에서 핫 리로드 시 중복 생성 방지)
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDbClient> | undefined;
};

export const db = globalForDb.db ?? createDbClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export type DB = typeof db;
