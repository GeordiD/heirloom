import { createFileRoute } from "@tanstack/react-router";
import { mealPlanService } from "#/server/services/mealPlanService";

export const Route = createFileRoute("/api/meal-plan/meals/$mealId")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const mealId = parseInt(params.mealId, 10);
        if (isNaN(mealId) || mealId < 1) {
          return new Response("Invalid meal ID", { status: 400 });
        }

        const body = (await request.json()) as { customText?: string };
        if (!body.customText) {
          return new Response("customText is required", { status: 400 });
        }

        await mealPlanService.updateMealCustomText(mealId, body.customText);
        return Response.json({ success: true });
      },

      DELETE: async ({ params }) => {
        const mealId = parseInt(params.mealId, 10);
        if (isNaN(mealId) || mealId < 1) {
          return new Response("Invalid meal ID", { status: 400 });
        }

        await mealPlanService.removeMeal(mealId);
        return Response.json({ success: true });
      },
    },
  },
});
