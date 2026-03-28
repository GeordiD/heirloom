import { createFileRoute } from "@tanstack/react-router";
import { shoppingListService } from "#/server/services/shoppingListService";
import { HttpError } from "#/server/utils/createError";

const DEFAULT_USER_ID = 1;

export const Route = createFileRoute("/api/shopping-list/items/$id")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
          return new Response("Invalid item ID", { status: 400 });
        }

        const body = (await request.json()) as { ingredientText?: string; checked?: boolean };

        if (body.ingredientText === undefined && body.checked === undefined) {
          return new Response("ingredientText or checked is required", { status: 400 });
        }

        try {
          const updated = await shoppingListService.updateItem(id, DEFAULT_USER_ID, body);
          return Response.json(updated);
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
