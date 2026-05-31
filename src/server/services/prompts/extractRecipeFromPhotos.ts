import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RecipeData } from '#/server/schemas/recipeSchema';
import { recipeSchema } from '#/server/schemas/recipeSchema';
import { llmService } from '#/server/services/llmService';
import { createError } from '#/server/utils/createError';
import { RECIPE_EXTRACTION_GUIDELINES } from './extractRecipe';

export async function extractRecipeFromPhotos(
  compressedDir: string,
): Promise<{ recipe: RecipeData }> {
  const files = (await readdir(compressedDir)).sort();
  const photos = await Promise.all(files.map((f) => readFile(join(compressedDir, f))));

  try {
    const result = await llmService.generateObject({
      schema: recipeSchema,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            ...photos.map((photo) => ({
              type: 'image' as const,
              image: photo,
              mimeType: 'image/jpeg' as const,
            })),
            {
              type: 'text' as const,
              text: `Extract recipe information from the provided photo${photos.length > 1 ? 's' : ''}.

                ${RECIPE_EXTRACTION_GUIDELINES}
                - Ingredients may be arranged in multiple columns. Scan the entire ingredients section carefully: read each column fully from top to bottom, then move to the next column. Do not skip any column or any item within a column.
                - If you receive multiple files, assume it's the same recipe across multiple pages and combine the information into a single complete recipe`,
            },
          ],
        },
      ],
    });

    return { recipe: result.object };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to extract recipe from photos: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });
  }
}
