import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export async function seedDatabase(db: NodePgDatabase<typeof schema>): Promise<void> {
  const existingUsers = await db.select().from(schema.users).limit(1);
  if (existingUsers.length > 0) {
    return;
  }

  await db.insert(schema.users).values([
    { email: "john@example.com", name: "John Doe" },
    { email: "jane@example.com", name: "Jane Smith" },
  ]);
}
