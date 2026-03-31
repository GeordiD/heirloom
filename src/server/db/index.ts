import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '#/server/env';
import * as schema from './schema';

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });

export const db = drizzle(pool, { schema });

export { schema };

/** Convenience wrapper kept for API compatibility with ported service code. */
export async function getDb() {
  return db;
}
