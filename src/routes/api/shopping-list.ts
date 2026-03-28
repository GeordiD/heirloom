import { createFileRoute } from "@tanstack/react-router";
import { shoppingListService } from "#/server/services/shoppingListService";
import { HttpError } from "#/server/utils/createError";

const DEFAULT_USER_ID = 1;

export const Route = createFileRoute("/api/shopping-list")({
  server: {
    handlers: {
      GET: async () => {
        const list = await shoppingListService.getActiveList(DEFAULT_USER_ID);
        return Response.json(list);
      },

      POST: async ({ request }) => {
        const body = (await request.json()) as {
          mealPlanId?: number;
          items?: Array<{ recipeId: number | null; mealId: number | null; ingredientText: string }>;
        };

        if (!body.mealPlanId || !Array.isArray(body.items)) {
          return new Response("mealPlanId and items are required", { status: 400 });
        }

        try {
          const items = await shoppingListService.addItems(
            DEFAULT_USER_ID,
            body.mealPlanId,
            body.items,
          );
          return Response.json(items, { status: 201 });
        } catch (err) {
          if (err instanceof HttpError) {
            return new Response(err.message, { status: err.statusCode });
          }
          throw err;
        }
      },

      DELETE: async ({ request }) => {
        const body = (await request.json()) as { mealPlanId?: number };

        if (!body.mealPlanId) {
          return new Response("mealPlanId is required", { status: 400 });
        }

        try {
          await shoppingListService.clearList(DEFAULT_USER_ID, body.mealPlanId);
          return Response.json({ success: true });
        } catch (err) {
          if (err instanceof HttpError) {
            return new Response(err.message, { status: err.statusCode });
          }
          throw err;
        }
      },
    },
  },
});
