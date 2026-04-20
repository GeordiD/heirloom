import type { MealPlanDay as MealPlanDayType } from '#/server/services/mealPlanService';
import { MealPlanMealSlot } from './MealPlanMealSlot';

interface Props {
  day: MealPlanDayType;
}

export function MealPlanDay({ day }: Props) {
  const dayName = day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1);

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground">{dayName}</h3>
      </div>

      <div className="space-y-4">
        <MealPlanMealSlot dayId={day.id} mealType="lunch" meals={day.lunch} />
        <MealPlanMealSlot dayId={day.id} mealType="dinner" meals={day.dinner} />
      </div>
    </div>
  );
}
