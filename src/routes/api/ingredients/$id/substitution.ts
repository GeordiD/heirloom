import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "#/server/db";
import { recipeIngredientSubstitutions } from "#/server/db/schema";

export const Route = createFileRoute("/api/ingredients/$id/substitution")({
  server: {
    handlers: {
      PUT: async ({ params, request }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid ingredient ID", { status: 400 });
        }

        const body = (await request.json()) as { ingredient?: string };
        if (!body.ingredient?.trim()) {
          return new Response("Ingredient text is required", { status: 400 });
        }

        const ingredient = body.ingredient.trim();
        const db = await getDb();

        const existing = await db.query.recipeIngredients.findFirst({
          where: (t, { eq }) => eq(t.id, id),
        });

        if (!existing) {
          return new Response("Ingredient not found", { status: 404 });
        }

        await db
          .delete(recipeIngredientSubstitutions)
          .where(eq(recipeIngredientSubstitutions.ingredientId, id));

        if (ingredient === existing.ingredient.trim()) {
          return Response.json({
            success: true,
            message: "Substitution removed (matched original)",
          });
        }

        await db.insert(recipeIngredientSubstitutions).values({ ingredientId: id, ingredient });

        return Response.json({ success: true, message: "Substitution saved" });
      },
    },
  },
});
