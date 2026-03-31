import { and, eq } from 'drizzle-orm';
import { getDb } from '#/server/db';
import { mealPlanDays, mealPlanMeals, mealPlans } from '#/server/db/schema';

export type MealType = 'lunch' | 'dinner';
export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type MealPlanMeal = {
  id: number;
  recipeId: number | null;
  recipeName: string | null;
  customText: string | null;
  sortOrder: number;
};

export type MealPlanDay = {
  id: number;
  dayOfWeek: DayOfWeek;
  date: string;
  lunch: MealPlanMeal[];
  dinner: MealPlanMeal[];
};

export type MealPlan = {
  id: number;
  weekStartDay: DayOfWeek;
  days: MealPlanDay[];
};

const daysOfWeek: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const daysMap: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

class MealPlanService {
  private readonly DEFAULT_USER_ID = 1;

  async getMealPlan(): Promise<MealPlan> {
    const db = await getDb();

    let mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.userId, this.DEFAULT_USER_ID),
      with: {
        days: {
          with: {
            meals: {
              with: { recipe: true },
              orderBy: (meals, { asc }) => [asc(meals.sortOrder)],
            },
          },
          orderBy: (days, { asc }) => [asc(days.date)],
        },
      },
    });

    if (!mealPlan) {
      mealPlan = await this.createMealPlan('sunday');
    }

    return {
      id: mealPlan.id,
      weekStartDay: mealPlan.weekStartDay as DayOfWeek,
      days: mealPlan.days.map((day) => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek as DayOfWeek,
        date: day.date,
        lunch: day.meals
          .filter((m) => m.mealType === 'lunch')
          .map((m) => ({
            id: m.id,
            recipeId: m.recipeId,
            recipeName: m.recipe?.name ?? null,
            customText: m.customText,
            sortOrder: m.sortOrder,
          })),
        dinner: day.meals
          .filter((m) => m.mealType === 'dinner')
          .map((m) => ({
            id: m.id,
            recipeId: m.recipeId,
            recipeName: m.recipe?.name ?? null,
            customText: m.customText,
            sortOrder: m.sortOrder,
          })),
      })),
    };
  }

  private async createMealPlan(weekStartDay: DayOfWeek) {
    const db = await getDb();

    const [newMealPlan] = await db
      .insert(mealPlans)
      .values({ userId: this.DEFAULT_USER_ID, weekStartDay })
      .returning();

    if (!newMealPlan) throw new Error('Failed to create meal plan');

    const weekStartIndex = daysOfWeek.indexOf(weekStartDay);
    const orderedDays = [
      ...daysOfWeek.slice(weekStartIndex),
      ...daysOfWeek.slice(0, weekStartIndex),
    ];

    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startDayIndex = daysMap[weekStartDay];
    let daysToGoBack = currentDayOfWeek - startDayIndex;
    if (daysToGoBack < 0) daysToGoBack += 7;

    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysToGoBack);

    const dayRecords = orderedDays.map((day, index) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);
      return {
        mealPlanId: newMealPlan.id,
        dayOfWeek: day,
        date: date.toISOString().split('T')[0]!,
      };
    });

    await db.insert(mealPlanDays).values(dayRecords);

    const completeMealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, newMealPlan.id),
      with: {
        days: {
          with: {
            meals: {
              with: { recipe: true },
              orderBy: (meals, { asc }) => [asc(meals.sortOrder)],
            },
          },
          orderBy: (days, { asc }) => [asc(days.date)],
        },
      },
    });

    if (!completeMealPlan) throw new Error('Failed to create meal plan');

    return completeMealPlan;
  }

  async addMealToDay(
    dayId: number,
    mealType: MealType,
    meal: { recipeId: number } | { customText: string },
  ): Promise<MealPlanMeal> {
    const db = await getDb();

    const existingMeals = await db.query.mealPlanMeals.findMany({
      where: and(eq(mealPlanMeals.dayId, dayId), eq(mealPlanMeals.mealType, mealType)),
    });

    const maxSortOrder =
      existingMeals.length > 0 ? Math.max(...existingMeals.map((m) => m.sortOrder)) : -1;

    const [newMeal] = await db
      .insert(mealPlanMeals)
      .values({
        dayId,
        mealType,
        recipeId: 'recipeId' in meal ? meal.recipeId : null,
        customText: 'customText' in meal ? meal.customText : null,
        sortOrder: maxSortOrder + 1,
      })
      .returning();

    const mealWithRecipe = await db.query.mealPlanMeals.findFirst({
      where: eq(mealPlanMeals.id, newMeal!.id),
      with: { recipe: true },
    });

    if (!mealWithRecipe) throw new Error('Failed to add meal');

    return {
      id: mealWithRecipe.id,
      recipeId: mealWithRecipe.recipeId,
      recipeName: mealWithRecipe.recipe?.name ?? null,
      customText: mealWithRecipe.customText,
      sortOrder: mealWithRecipe.sortOrder,
    };
  }

  async removeMeal(mealId: number): Promise<void> {
    const db = await getDb();
    await db.delete(mealPlanMeals).where(eq(mealPlanMeals.id, mealId));
  }

  async clearAllMeals(): Promise<void> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.userId, this.DEFAULT_USER_ID),
      with: { days: true },
    });

    if (!mealPlan) throw new Error('No meal plan found');

    for (const day of mealPlan.days) {
      await db.delete(mealPlanMeals).where(eq(mealPlanMeals.dayId, day.id));
    }
  }

  async updateMealCustomText(mealId: number, customText: string): Promise<void> {
    const db = await getDb();
    await db.update(mealPlanMeals).set({ customText }).where(eq(mealPlanMeals.id, mealId));
  }

  async updateWeekStartDay(weekStartDay: DayOfWeek): Promise<void> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.userId, this.DEFAULT_USER_ID),
    });

    if (!mealPlan) throw new Error('No meal plan found');

    await db
      .update(mealPlans)
      .set({ weekStartDay, updatedAt: new Date() })
      .where(eq(mealPlans.id, mealPlan.id));

    await db.delete(mealPlanDays).where(eq(mealPlanDays.mealPlanId, mealPlan.id));

    const weekStartIndex = daysOfWeek.indexOf(weekStartDay);
    const orderedDays = [
      ...daysOfWeek.slice(weekStartIndex),
      ...daysOfWeek.slice(0, weekStartIndex),
    ];

    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startDayIndex = daysMap[weekStartDay];
    let daysToGoBack = currentDayOfWeek - startDayIndex;
    if (daysToGoBack < 0) daysToGoBack += 7;

    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysToGoBack);

    const dayRecords = orderedDays.map((day, index) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);
      return {
        mealPlanId: mealPlan.id,
        dayOfWeek: day,
        date: date.toISOString().split('T')[0]!,
      };
    });

    await db.insert(mealPlanDays).values(dayRecords);
  }
}

export const mealPlanService = new MealPlanService();
