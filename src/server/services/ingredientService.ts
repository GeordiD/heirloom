import { eq, ilike, or } from "drizzle-orm";
import { getDb } from "#/server/db";
import { ingredients } from "#/server/db/schema";

class IngredientService {
  async findSimilarIngredients(
    name: string,
    limit: number = 20,
  ): Promise<{ id: number; name: string }[]> {
    const db = await getDb();

    const words = name.toLowerCase().split(/\s+/);
    const patterns = words.map((word) => ilike(ingredients.name, `%${word}%`));

    return db
      .select({ id: ingredients.id, name: ingredients.name })
      .from(ingredients)
      .where(or(...patterns))
      .limit(limit);
  }

  async findIngredientByName(name: string) {
    const db = await getDb();
    return db.query.ingredients.findFirst({
      where: eq(ingredients.name, name),
    });
  }

  async createIngredient(name: string) {
    const db = await getDb();
    const [newIngredient] = await db.insert(ingredients).values({ name }).returning();
    return newIngredient;
  }
}

export const ingredientService = new IngredientService();
