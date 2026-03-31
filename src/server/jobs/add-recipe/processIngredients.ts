import pLimit from 'p-limit';
import { step } from '#/server/jobs/helpers/step';
import type { ParsedIngredient } from '#/server/schemas/ingredientSchema';
import type { RecipeData } from '#/server/schemas/recipeSchema';
import { ingredientService } from '#/server/services/ingredientService';
import { matchIngredient } from '#/server/services/prompts/matchIngredient';
import { parseIngredient } from '#/server/services/prompts/parseIngredient';
import { createError } from '#/server/utils/createError';

export type MappedIngredient = {
  ingredient: string;
  ingredientId: number;
} & ParsedIngredient;

export interface MappedIngredientGroup {
  name?: string;
  mappedItems: MappedIngredient[];
}

export async function processIngredients({
  ingredients: ingredientGroups,
}: Pick<RecipeData, 'ingredients'>): Promise<MappedIngredientGroup[]> {
  const limit = pLimit(5);
  const ingredientNames = ingredientGroups.flatMap(({ items }, i) =>
    items.map((name) => ({ name, groupIndex: i })),
  );

  const tasks = ingredientNames.map(({ name, groupIndex }) =>
    limit(() =>
      step(
        'process-ingredient',
        async ({ rawName, groupIndex }: { rawName: string; groupIndex: number }) => {
          const mappedIngredient = await processIngredient(rawName);
          return { mappedIngredient, groupIndex };
        },
        { rawName: name, groupIndex },
      ),
    ),
  );

  const ingredientResults = await Promise.all(tasks);

  return ingredientGroups.map((group, i) => ({
    mappedItems: ingredientResults.filter((x) => x.groupIndex === i).map((x) => x.mappedIngredient),
    name: group.name,
  }));
}

export async function processIngredient(rawName: string): Promise<MappedIngredient> {
  const { parsed } = await step('llm-parse-ingredient', parseIngredient, rawName);

  const matchedIngredient = await matchIngredientName(parsed.name);

  return {
    ingredient: rawName,
    ingredientId: matchedIngredient.id,
    name: matchedIngredient.name,
    note: parsed.note,
    quantity: parsed.quantity,
    unit: parsed.unit,
  };
}

async function matchIngredientName(inputName: string): Promise<{ id: number; name: string }> {
  const exactMatch = await step(
    'match-ingredient-via-exact',
    ingredientService.findIngredientByName.bind(ingredientService),
    inputName,
  );
  if (exactMatch) return exactMatch;

  const candidates = await ingredientService.findSimilarIngredients(inputName);
  const { match } = await step('match-ingredient-via-llm', matchIngredient, {
    parsedName: inputName,
    candidates,
  });

  if (match.matchedId !== null) {
    const existingIngredient = await ingredientService.findIngredientByName(match.standardizedName);

    if (!existingIngredient) {
      throw createError({
        statusCode: 500,
        statusMessage: `Matched ingredient ID ${match.matchedId} not found in database`,
      });
    }

    return existingIngredient;
  }

  const createdIngredient = await ingredientService.createIngredient(match.standardizedName);

  if (!createdIngredient) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create new ingredient' });
  }

  return createdIngredient;
}
