import { createServerFn } from '@tanstack/react-start';
import { recipeService } from '#/server/services/recipeService';

export const fetchRecipes = createServerFn({ method: 'GET' }).handler(() =>
  recipeService.getAllRecipes(),
);
