import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { FastResponse } from 'srvx';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '#/server/db';

globalThis.Response = FastResponse;

await migrate(db, {
  migrationsFolder: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'assets/migrations'),
});

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
