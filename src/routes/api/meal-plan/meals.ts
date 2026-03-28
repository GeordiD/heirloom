import { createFileRoute } from "@tanstack/react-router";
import type { MealType } from "#/server/services/mealPlanService";
import { mealPlanService } from "#/server/services/mealPlanService";

export const Route = createFileRoute("/api/meal-plan/meals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          dayId?: number;
          mealType?: string;
          recipeId?: number;
          customText?: string;
        };

        if (!body.dayId || !body.mealType) {
          return new Response("dayId and mealType are required", { status: 400 });
        }

        if (body.mealType !== "lunch" && body.mealType !== "dinner") {
          return new Response("mealType must be lunch or dinner", { status: 400 });
        }

        if (!body.recipeId && !body.customText) {
          return new Response("recipeId or customText is required", { status: 400 });
        }

        const meal = body.recipeId ? { recipeId: body.recipeId } : { customText: body.customText! };

        const added = await mealPlanService.addMealToDay(
          body.dayId,
          body.mealType as MealType,
          meal,
        );

        return Response.json(added, { status: 201 });
      },

      DELETE: async () => {
        await mealPlanService.clearAllMeals();
        return Response.json({ success: true });
      },
    },
  },
});
