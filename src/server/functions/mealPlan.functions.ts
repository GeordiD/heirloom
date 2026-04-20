import { mealPlanService } from '#/server/services/mealPlanService';
import type { MealType } from '#/server/services/mealPlanService';
import { createServerFn } from '@tanstack/react-start';

export const fetchMealPlan = createServerFn({ method: 'GET' }).handler(() =>
  mealPlanService.getMealPlan(),
);

export const addMealToDay = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { dayId: number; mealType: MealType; recipeId?: number; customText?: string }) => input,
  )
  .handler((ctx) => {
    const { dayId, mealType, recipeId, customText } = ctx.data;
    const meal = recipeId !== undefined ? { recipeId } : { customText: customText ?? 'Leftovers' };
    return mealPlanService.addMealToDay(dayId, mealType, meal);
  });

export const removeMeal = createServerFn({ method: 'POST' })
  .inputValidator((input: { mealId: number }) => input)
  .handler((ctx) => mealPlanService.removeMeal(ctx.data.mealId));

export const clearAllMeals = createServerFn({ method: 'POST' }).handler(() =>
  mealPlanService.clearAllMeals(),
);

export const updateMealCustomText = createServerFn({ method: 'POST' })
  .inputValidator((input: { mealId: number; customText: string }) => input)
  .handler((ctx) => mealPlanService.updateMealCustomText(ctx.data.mealId, ctx.data.customText));
