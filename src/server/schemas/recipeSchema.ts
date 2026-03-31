import { z } from 'zod';

export const recipeSchema = z.object({
  name: z
    .string()
    .min(1, 'Recipe name is required')
    .max(200, 'Recipe name too long')
    .describe(
      'The name of the recipe. Keep this as generic as possible while still being descriptive. Shorter is better. Omit unnecessary words.',
    ),

  prepTime: z
    .string()
    .max(50, 'Prep time too long')
    .optional()
    .describe('Preparation time listed in the recipe (e.g., "15 minutes", "1 hour")'),

  cookTime: z
    .string()
    .max(50, 'Cook time too long')
    .optional()
    .describe('Cooking time listed in the recipe (e.g., "30 minutes", "2 hours")'),

  totalTime: z
    .string()
    .max(50, 'Total time too long')
    .optional()
    .describe(
      'Total time from start to finish (listed in the recipe -- do not calculate this yourself)',
    ),

  servings: z
    .string()
    .max(50, 'Servings too long')
    .optional()
    .describe('Number of servings (e.g., "4 people", "6-8 servings")'),

  cuisine: z
    .string()
    .max(100, 'Cuisine too long')
    .optional()
    .describe('Type of cuisine (e.g., "Italian", "Chinese", "American")'),

  ingredients: z
    .array(
      z.object({
        name: z
          .string()
          .max(200, 'Group name too long')
          .optional()
          .describe(
            'Name of ingredient group (e.g., "Marinade", "Sauce"). Leave blank if only one group.',
          ),
        items: z
          .array(
            z
              .string()
              .min(1, 'Ingredient cannot be empty')
              .max(200, 'Ingredient description too long')
              .describe('Individual ingredient with quantity and description'),
          )
          .min(1, 'At least one ingredient is required per group')
          .max(30, 'Too many ingredients in group')
          .describe('List of ingredients in this group'),
      }),
    )
    .min(1, 'At least one ingredient group is required')
    .max(10, 'Too many ingredient groups')
    .describe(
      'Ingredient groups. Most recipes have one group (leave name blank). Use multiple groups for recipes with sections like "Marinade", "Main dish", etc.',
    ),

  instructions: z
    .array(
      z
        .string()
        .min(1, 'Instruction cannot be empty')
        .describe('Individual step in the cooking process'),
    )
    .min(1, 'At least one instruction is required')
    .describe('Step-by-step cooking instructions'),

  notes: z
    .array(
      z
        .string()
        .min(1, 'Note cannot be empty')
        .max(200, 'Note too long')
        .describe('Individual important note, tip, or variation'),
    )
    .max(6, 'Too many notes - only include the most important ones')
    .optional()
    .describe(
      'Only the most important notes, tips, or variations. If not critically important, omit entirely.',
    ),
});

export type RecipeData = z.infer<typeof recipeSchema>;
