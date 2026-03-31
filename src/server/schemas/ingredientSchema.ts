import { z } from 'zod';

export const parsedIngredientSchema = z.object({
  quantity: z
    .string()
    .nullable()
    .describe(
      'The quantity/amount (e.g., "2", "1/2", "2-3", "a pinch"). Null if not specified or "to taste".',
    ),
  unit: z
    .string()
    .nullable()
    .describe(
      'The unit of measurement (e.g., "cups", "tbsp", "oz", "grams"). Null if not specified or for count-based items.',
    ),
  name: z
    .string()
    .describe(
      'The standardized ingredient name, singular form (e.g., "green bell pepper", "garlic", "olive oil")',
    ),
  note: z
    .string()
    .nullable()
    .describe(
      'Additional preparation notes or modifiers (e.g., "diced", "minced", "optional", "room temperature"). Null if none.',
    ),
});

export type ParsedIngredient = z.infer<typeof parsedIngredientSchema>;

export const ingredientMatchSchema = z.object({
  matchedId: z
    .number()
    .nullable()
    .describe('The ID of the matched ingredient from the database. Null if no good match found.'),
  standardizedName: z
    .string()
    .describe(
      'The standardized name to use. If matchedId is provided, this should match the matched ingredient. If null, this is the suggested new standardized name.',
    ),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'Confidence level of the match. "high" for exact/very close matches, "medium" for likely matches, "low" for uncertain matches.',
    ),
});

export type IngredientMatch = z.infer<typeof ingredientMatchSchema>;

export const standardizedIngredientSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type StandardizedIngredient = z.infer<typeof standardizedIngredientSchema>;
