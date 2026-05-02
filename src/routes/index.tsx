import { MealPlanDay } from '#/components/meal-plan/MealPlanDay';
import { Button } from '#/components/ui/button';
import { useShowFooter } from '#/contexts/FooterContext';
import { clearAllMeals, fetchMealPlan } from '#/server/functions/mealPlan.functions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

const mealPlanQueryOptions = {
  queryKey: ['meal-plan'] as const,
  queryFn: fetchMealPlan,
};

export const Route = createFileRoute('/')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(mealPlanQueryOptions),
  component: MealPlanPage,
});

function MealPlanPage() {
  useShowFooter(true);
  const queryClient = useQueryClient();
  const { data: mealPlan, isPending, error } = useQuery(mealPlanQueryOptions);

  async function handleClearAll() {
    try {
      await clearAllMeals();
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
    } catch (err) {
      console.error('Failed to clear meals:', err);
    }
  }

  return (
    <>
      <main className="mx-auto max-w-4xl px-6 py-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meal Plan</h1>
        </div>

        {isPending && !mealPlan ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Loading meal plan...</div>
          </div>
        ) : error && !mealPlan ? (
          <div className="py-12 text-center text-destructive">
            <p>Failed to load meal plan. Please try again later.</p>
          </div>
        ) : mealPlan ? (
          <div className="space-y-6">
            {mealPlan.days.map((day) => (
              <MealPlanDay key={day.id} day={day} />
            ))}
          </div>
        ) : null}

        <div className="bg-background border-t border-border p-4">
          <div className="mx-auto max-w-4xl flex gap-3">
            <Button variant="outline" size="lg" onClick={() => void handleClearAll()}>
              Clear All
            </Button>
            <Button asChild size="lg" className="flex-1">
              <a href="/lists/create">Create Shopping List</a>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
