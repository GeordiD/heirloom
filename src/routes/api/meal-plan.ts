import { createFileRoute } from "@tanstack/react-router";
import { mealPlanService } from "#/server/services/mealPlanService";
import { errorToResponse } from "#/server/utils/createError";

export const Route = createFileRoute("/api/meal-plan")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const mealPlan = await mealPlanService.getMealPlan();
          return Response.json(mealPlan);
        } catch (err) {
          return errorToResponse(err);
        }
      },
    },
  },
});
