import { createFileRoute } from "@tanstack/react-router";
import { recipeService } from "#/server/services/recipeService";

export const Route = createFileRoute("/api/recipes/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid recipe ID", { status: 400 });
        }

        const recipe = await recipeService.getRecipeById(id);
        if (!recipe) {
          return new Response("Recipe not found", { status: 404 });
        }

        return Response.json(recipe);
      },

      PATCH: async ({ params, request }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid recipe ID", { status: 400 });
        }

        const body = (await request.json()) as { name?: string };
        if (!body.name) {
          return new Response("Name is required", { status: 400 });
        }

        const updated = await recipeService.updateRecipeName(id, body.name);
        if (!updated) {
          return new Response("Recipe not found", { status: 404 });
        }

        return Response.json({ success: true });
      },

      DELETE: async ({ params }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid recipe ID", { status: 400 });
        }

        const deleted = await recipeService.softDeleteRecipe(id);
        if (!deleted) {
          return new Response("Recipe not found", { status: 404 });
        }

        return Response.json({ success: true });
      },
    },
  },
});
