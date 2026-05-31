import type { RecipeData } from '#/server/schemas/recipeSchema';
import { recipeSchema } from '#/server/schemas/recipeSchema';
import { llmService } from '#/server/services/llmService';
import { createError } from '#/server/utils/createError';

export const RECIPE_EXTRACTION_GUIDELINES = `Guidelines:
- Extract ingredients as individual items, preserving quantities and descriptions
- Copy instructions verbatim, exactly as written — do not paraphrase, summarize, or reword
- Include timing information if present
- Be precise and don't add information not in the content
- If information is not available, omit that field
- For the notes, you should paraphrase any additional information provided in the recipe concisely (< 200 char per note)`;

export async function extractRecipe(content: string): Promise<{ recipe: RecipeData }> {
  const prompt = `Extract recipe information from the provided content.

${RECIPE_EXTRACTION_GUIDELINES}

Content:
<content>
${content}
</content>`;

  try {
    const result = await llmService.generateObject({
      schema: recipeSchema,
      prompt,
    });

    return { recipe: result.object };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to extract recipe: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });
  }
}
