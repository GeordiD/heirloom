import { mealPlanService } from '#/server/services/mealPlanService';
import { recipeService } from '#/server/services/recipeService';
import { shoppingListService } from '#/server/services/shoppingListService';
import { createServerFn } from '@tanstack/react-start';

const USER_ID = 1;

export const fetchShoppingList = createServerFn({ method: 'GET' }).handler(() =>
  shoppingListService.getActiveList(USER_ID),
);

export const fetchShoppingListCreationData = createServerFn({ method: 'GET' }).handler(async () => {
  const mealPlan = await mealPlanService.getMealPlan();

  const recipeIds = new Set<number>();
  const customMeals: Array<{ mealId: number; name: string }> = [];

  for (const day of mealPlan.days) {
    for (const meal of [...day.lunch, ...day.dinner]) {
      if (meal.recipeId) {
        recipeIds.add(meal.recipeId);
      } else if (meal.customText && meal.customText !== 'Leftovers') {
        customMeals.push({ mealId: meal.id, name: meal.customText });
      }
    }
  }

  const fetchedRecipes = await Promise.all(
    Array.from(recipeIds).map((id) => recipeService.getRecipeById(id)),
  );

  const recipes = fetchedRecipes
    .filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined)
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients.flatMap((group) =>
        group.items
          .filter((item) => !item.isUnused)
          .map((item) => ({ id: item.id, text: item.name ?? '' })),
      ),
    }));

  return { mealPlanId: mealPlan.id, recipes, customMeals };
});

export const addShoppingListItems = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      mealPlanId: number;
      items: Array<{ recipeId: number | null; mealId: number | null; ingredientText: string }>;
    }) => input,
  )
  .handler((ctx) => shoppingListService.addItems(USER_ID, ctx.data.mealPlanId, ctx.data.items));

export const updateShoppingListItem = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: number; checked: boolean }) => input)
  .handler((ctx) =>
    shoppingListService.updateItem(ctx.data.id, USER_ID, { checked: ctx.data.checked }),
  );
