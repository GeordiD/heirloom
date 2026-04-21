import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

try {
  new URL(connectionString);
} catch {
  console.error(
    `ERROR: DATABASE_URL is not a valid URL (value starts with: "${connectionString.slice(0, 20)}...")`,
  );
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

try {
  await migrate(db, { migrationsFolder: '/app/migrations' });
  console.log('Migrations applied successfully');
} finally {
  await pool.end();
}
