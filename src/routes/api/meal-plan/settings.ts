import { createFileRoute } from "@tanstack/react-router";
import type { DayOfWeek } from "#/server/services/mealPlanService";
import { mealPlanService } from "#/server/services/mealPlanService";

const VALID_DAYS: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const Route = createFileRoute("/api/meal-plan/settings")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const body = (await request.json()) as { weekStartDay?: string };

        if (!body.weekStartDay || !VALID_DAYS.includes(body.weekStartDay as DayOfWeek)) {
          return new Response("Valid weekStartDay is required", { status: 400 });
        }

        await mealPlanService.updateWeekStartDay(body.weekStartDay as DayOfWeek);
        return Response.json({ success: true });
      },
    },
  },
});
