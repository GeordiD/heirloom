import { createFileRoute } from "@tanstack/react-router";
import { recipeService } from "#/server/services/recipeService";

export const Route = createFileRoute("/api/recipes")({
  server: {
    handlers: {
      GET: async () => {
        const recipes = await recipeService.getAllRecipes();
        return Response.json(recipes);
      },
    },
  },
});
