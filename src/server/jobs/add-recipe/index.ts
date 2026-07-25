import type { JobEventEmitter } from '#/server/jobs/helpers/jobContext';
import { job } from '#/server/jobs/helpers/job';
import { step } from '#/server/jobs/helpers/step';
import { compressPhotos } from '#/server/jobs/add-recipe/compressPhotos';
import type { MappedIngredientGroup } from '#/server/jobs/add-recipe/processIngredients';
import { processIngredients } from '#/server/jobs/add-recipe/processIngredients';
import { saveRecipe } from '#/server/jobs/add-recipe/saveRecipe';
import { scrapeAndCleanContent } from '#/server/jobs/add-recipe/scrapeAndCleanContent';
import type { RecipeData } from '#/server/schemas/recipeSchema';
import { extractRecipe } from '#/server/services/prompts/extractRecipe';
import { extractRecipeFromPhotos } from '#/server/services/prompts/extractRecipeFromPhotos';

export interface RecipeDataWithMappedIngredients extends Omit<RecipeData, 'ingredients'> {
  ingredients: MappedIngredientGroup[];
}

export async function addRecipeByUrl(
  url: string,
  onEvent?: JobEventEmitter,
): Promise<{ id: number }> {
  const result = await job(
    'add-recipe',
    async () => {
      const cleanedContent = await step('scrape-data', scrapeAndCleanContent, url);

      const { recipe } = await step('extract-recipe', extractRecipe, cleanedContent);

      const mappedIngredientGroups = await processIngredients(recipe);

      const { ingredients: _, ...restOfRecipe } = recipe;

      const mappedRecipe: RecipeDataWithMappedIngredients = {
        ...restOfRecipe,
        ingredients: mappedIngredientGroups,
      };

      return saveRecipe(mappedRecipe, url);
    },
    onEvent,
  );

  return result.result;
}

export async function addRecipeByPhoto(
  uploadId: string,
  onEvent?: JobEventEmitter,
): Promise<{ id: number }> {
  const result = await job(
    'add-recipe-photo',
    async () => {
      const compressedDir = await step('compress-photos', compressPhotos, uploadId);
      const { recipe } = await step('extract-recipe', extractRecipeFromPhotos, compressedDir);

      const mappedIngredientGroups = await processIngredients(recipe);
      const { ingredients: _, ...restOfRecipe } = recipe;

      const mappedRecipe: RecipeDataWithMappedIngredients = {
        ...restOfRecipe,
        ingredients: mappedIngredientGroups,
      };

      return saveRecipe(mappedRecipe, '');
    },
    onEvent,
  );

  return result.result;
}
