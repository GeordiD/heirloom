import { addRecipeByUrl as addRecipeByUrlJob } from '#/server/jobs/add-recipe';
import { job } from '#/server/jobs/helpers/job';
import { processIngredients } from '#/server/jobs/add-recipe/processIngredients';
import { saveRecipe } from '#/server/jobs/add-recipe/saveRecipe';
import type { RecipeDataWithMappedIngredients } from '#/server/jobs/add-recipe';
import { recipeService } from '#/server/services/recipeService';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

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
  .inputValidator((input: { id: number; value?: boolean }) => input)
  .handler((ctx) => recipeService.markIngredientDoNotUse(ctx.data.id, ctx.data.value));

export const upsertIngredientSubstitution = createServerFn({ method: 'POST' })
  .inputValidator((input: { recipeIngredientId: number; ingredient: string }) => input)
  .handler((ctx) =>
    recipeService.upsertIngredientSubstitution(ctx.data.recipeIngredientId, ctx.data.ingredient),
  );

const addRecipeByUrlInput = z.object({ url: z.string().url() });

export const addRecipeByUrl = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => addRecipeByUrlInput.parse(input))
  .handler((ctx) => addRecipeByUrlJob(ctx.data.url));

const addRecipeManuallyInput = z.object({
  name: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string()),
});

const FALLBACK_INSTRUCTION = 'Cook it!';

export const addRecipeManually = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => addRecipeManuallyInput.parse(input))
  .handler(async (ctx) => {
    const { name, ingredients, instructions } = ctx.data;
    const finalInstructions = instructions.length > 0 ? instructions : [FALLBACK_INSTRUCTION];

    const { result } = await job('add-recipe-manual', async () => {
      const mappedIngredientGroups = await processIngredients({
        ingredients: [{ items: ingredients }],
      });

      const mappedRecipe: RecipeDataWithMappedIngredients = {
        name,
        ingredients: mappedIngredientGroups,
        instructions: finalInstructions,
      };

      return saveRecipe(mappedRecipe, '');
    });

    return result;
  });
