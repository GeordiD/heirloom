import { createServerFn } from '@tanstack/react-start';
import { recipeService } from '#/server/services/recipeService';

export const fetchRecipes = createServerFn({ method: 'GET' }).handler(() =>
  recipeService.getAllRecipes(),
);

export const fetchRecipeById = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler((ctx) => recipeService.getRecipeById(ctx.data));

export const deleteRecipe = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler((ctx) => recipeService.softDeleteRecipe(ctx.data));

export const updateRecipeName = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: number; name: string }) => input)
  .handler((ctx) => recipeService.updateRecipeName(ctx.data.id, ctx.data.name));

export const markIngredientDoNotUse = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler((ctx) => recipeService.markIngredientDoNotUse(ctx.data));

export const upsertIngredientSubstitution = createServerFn({ method: 'POST' })
  .inputValidator((input: { recipeIngredientId: number; ingredient: string }) => input)
  .handler((ctx) =>
    recipeService.upsertIngredientSubstitution(ctx.data.recipeIngredientId, ctx.data.ingredient),
  );
