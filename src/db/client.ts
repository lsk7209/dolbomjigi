import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { _db: DrizzleDb | undefined };

function initDb(): DrizzleDb {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set');
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

function getDb(): DrizzleDb {
  if (!globalForDb._db) {
    globalForDb._db = initDb();
  }
  return globalForDb._db;
}

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_t, prop: string | symbol) {
    const instance = getDb();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function'
      ? (val as (...args: unknown[]) => unknown).bind(instance)
      : val;
  },
});

export type DB = typeof db;
