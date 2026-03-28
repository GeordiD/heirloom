import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "#/server/db";

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async () => {
        const db = await getDb();
        const users = await db.query.users.findMany();
        return Response.json(users);
      },
    },
  },
});
