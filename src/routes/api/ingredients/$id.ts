import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "#/server/db";
import { recipeIngredients } from "#/server/db/schema";

const bodySchema = z.object({
  ingredient: z.string().min(1).optional(),
  doNotUse: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const Route = createFileRoute("/api/ingredients/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid ingredient ID", { status: 400 });
        }

        const rawBody = await request.json();
        const parsed = bodySchema.safeParse(rawBody);
        if (!parsed.success) {
          return new Response(parsed.error.issues[0]?.message ?? "Invalid body", { status: 400 });
        }

        const updates = parsed.data;
        if (Object.keys(updates).length === 0) {
          return new Response("At least one field must be provided", { status: 400 });
        }

        const db = await getDb();

        const existing = await db.query.recipeIngredients.findFirst({
          where: (t, { eq }) => eq(t.id, id),
        });

        if (!existing) {
          return new Response("Ingredient not found", { status: 404 });
        }

        await db.update(recipeIngredients).set(updates).where(eq(recipeIngredients.id, id));

        return Response.json({ success: true });
      },
    },
  },
});
