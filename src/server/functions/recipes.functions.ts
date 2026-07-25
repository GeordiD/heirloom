import {
  addRecipeByUrl as addRecipeByUrlJob,
  addRecipeByPhoto,
  addRecipeByFile,
} from '#/server/jobs/add-recipe';
import { job } from '#/server/jobs/helpers/job';
import { processIngredients } from '#/server/jobs/add-recipe/processIngredients';
import { saveRecipe } from '#/server/jobs/add-recipe/saveRecipe';
import type { RecipeDataWithMappedIngredients } from '#/server/jobs/add-recipe';
import { recipeService } from '#/server/services/recipeService';
import { createServerFn } from '@tanstack/react-start';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { z } from 'zod';
import { createError } from '#/server/utils/createError';

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

const uploadRecipePhotosInput = z.object({
  photos: z
    .array(
      z.object({
        data: z.string().min(1),
        mimeType: z.string().regex(/^image\//),
      }),
    )
    .min(1)
    .max(10),
});

const processRecipePhotosInput = z.object({ uploadId: z.string().uuid() });

export const processRecipePhotos = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => processRecipePhotosInput.parse(input))
  .handler((ctx) => addRecipeByPhoto(ctx.data.uploadId));

export const uploadRecipePhotos = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => uploadRecipePhotosInput.parse(input))
  .handler(async (ctx) => {
    const { photos } = ctx.data;
    const uploadId = crypto.randomUUID();
    const dir = join(tmpdir(), 'heirloom-photos', uploadId);
    await mkdir(dir, { recursive: true });

    await Promise.all(
      photos.map(async (photo, i) => {
        const ext = photo.mimeType.split('/')[1] ?? 'jpg';
        const filePath = join(dir, `photo-${i}.${ext}`);
        await writeFile(filePath, Buffer.from(photo.data, 'base64'));
      }),
    );

    return { uploadId };
  });

const ALLOWED_FILE_EXTENSIONS = new Set(['.txt', '.html', '.htm', '.pdf']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const uploadRecipeFileInput = z.object({
  data: z.string().min(1),
  fileName: z.string().min(1),
});

const processRecipeFileInput = z.object({ uploadId: z.string().uuid() });

export const processRecipeFile = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => processRecipeFileInput.parse(input))
  .handler((ctx) => addRecipeByFile(ctx.data.uploadId));

export const uploadRecipeFile = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => uploadRecipeFileInput.parse(input))
  .handler(async (ctx) => {
    const { data, fileName } = ctx.data;
    const ext = extname(fileName).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
      throw createError({ statusCode: 400, statusMessage: `Unsupported file type: ${ext}` });
    }

    const buffer = Buffer.from(data, 'base64');
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'File is too large (max 10MB)' });
    }

    const uploadId = crypto.randomUUID();
    const dir = join(tmpdir(), 'heirloom-files', uploadId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), buffer);

    return { uploadId };
  });

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
