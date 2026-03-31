import { eq } from 'drizzle-orm';
import { getDb } from '#/server/db';
import { recipes } from '#/server/db/schema';

export type Recipe = {
  id: number;
  name: string;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  cuisine: string | null;
};

class RecipeService {
  async getAllRecipes(): Promise<Recipe[]> {
    const db = await getDb();

    const rows = await db.query.recipes.findMany({
      where: (r, { isNull }) => isNull(r.deletedAt),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      totalTime: r.totalTime,
      servings: r.servings,
      cuisine: r.cuisine,
    }));
  }

  async getRecipeById(id: number) {
    const db = await getDb();

    const recipe = await db.query.recipes.findFirst({
      where: (r, { eq, isNull, and }) => and(eq(r.id, id), isNull(r.deletedAt)),
      with: {
        ingredientGroups: {
          with: {
            ingredients: {
              with: { substitutions: true },
            },
          },
          orderBy: (g, { asc }) => [asc(g.sortOrder)],
        },
        instructions: {
          orderBy: (i, { asc }) => [asc(i.stepNumber)],
        },
        notes: {
          orderBy: (n, { asc }) => [asc(n.sortOrder)],
        },
      },
    });

    if (!recipe) return null;

    return {
      id: recipe.id,
      name: recipe.name,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      sourceUrl: recipe.sourceUrl,
      ingredients: recipe.ingredientGroups.map((group) => ({
        name: group.name,
        items: group.ingredients
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.substitutions.length
              ? ingredient.substitutions.at(0)?.ingredient
              : ingredient.ingredient,
            isSubstituted: !!ingredient.substitutions.length,
            isUnused: !!ingredient.doNotUse,
          })),
      })),
      instructions: recipe.instructions.map((i) => i.instruction),
      notes: recipe.notes.map((n) => n.note),
    };
  }

  async updateRecipeName(id: number, name: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .update(recipes)
      .set({ name, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return result.length > 0;
  }

  async softDeleteRecipe(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .update(recipes)
      .set({ deletedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return result.length > 0;
  }
}

export const recipeService = new RecipeService();
