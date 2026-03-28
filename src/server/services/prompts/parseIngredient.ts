import type { ParsedIngredient } from "#/server/schemas/ingredientSchema";
import { parsedIngredientSchema } from "#/server/schemas/ingredientSchema";
import { llmService } from "#/server/services/llmService";
import { createError } from "#/server/utils/createError";

const PARSING_SYSTEM_PROMPT = `You are an expert at parsing recipe ingredient text into structured components.

Your task is to extract:
1. **quantity**: The numeric amount (e.g., "2", "0.5", "2-3", "a pinch")
   - Use null if not specified or for "to taste"
   - Keep fractions as text in decimal form, rounded to maximum of 2 decimal places (e.g., "0.5", "1.33")
   - Keep ranges as text (e.g., "2-3", "1-2")

2. **unit**: The unit of measurement (e.g., "cups", "tbsp", "tsp", "oz", "grams", "lbs")
   - Use null if not specified or for count-based items (e.g., "2 eggs")
   - Normalize abbreviations: "tbsp" not "T", "tsp" not "t", etc.
   - Should always be singular (e.g., "cup" not "cups")
   - For containers (can, pouch, jar, box, package), include the container size in the unit (e.g., "14.5 oz can", "10 oz pouch")

3. **name**: The ingredient name in singular form
   - Use singular form (e.g., "green bell pepper" not "green bell peppers")
   - Keep descriptive modifiers that are part of the ingredient identity (e.g., "green bell pepper", "mandarin orange", "chicken breast")
   - Remove preparation details; those go in notes. (e.g., "minced", "freshly cracked")
   - Standardize common variations (e.g., "olive oil" not "extra virgin olive oil")

4. **note**: Preparation details, modifiers, or optional markers
   - Include preparation methods (e.g., "diced", "minced", "chopped")
   - Include state descriptors (e.g., "room temperature", "melted", "softened")
   - Include optional markers (e.g., "optional", "if desired")
   - Use null if there are no additional notes.

Examples:
- "2 cups green bell peppers, diced" → {quantity: "2", unit: "cup", name: "green bell pepper", note: "diced"}
- "1/2 tsp salt" → {quantity: "1/2", unit: "tsp", name: "salt", note: null}
- "3 oranges" → {quantity: "3", unit: null, name: "orange", note: null}
- "3 garlic cloves, minced" → {quantity: "3", unit: "clove", name: "garlic", note: "minced"}
- "2 14.5 oz cans diced tomatoes" → {quantity: "2", unit: "14.5 oz can", name: "diced tomato", note: null}
- "Salt and pepper to taste" → {quantity: null, unit: null, name: "salt and pepper", note: "to taste"}
- "1 lb ground beef (optional)" → {quantity: "1", unit: "lb", name: "ground beef", note: "optional"}`;

export async function parseIngredient(
  rawIngredient: string,
): Promise<{ parsed: ParsedIngredient }> {
  try {
    const result = await llmService.generateObject({
      schema: parsedIngredientSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: PARSING_SYSTEM_PROMPT,
              providerOptions: {
                anthropic: { cacheControl: { type: "ephemeral" } },
              },
            },
            {
              type: "text",
              text: `Parse the following ingredient:\n\n${rawIngredient}`,
            },
          ],
        },
      ],
    });

    return { parsed: result.object };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to parse ingredient "${rawIngredient}": ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }
}
