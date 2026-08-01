import { getDb } from '#/server/db';
import { mealPlans, shoppingListItems } from '#/server/db/schema';
import { createError } from '#/server/utils/createError';
import { and, eq, isNull } from 'drizzle-orm';

export type ShoppingListItem = {
  id: number;
  recipeId: number | null;
  recipeName: string | null;
  mealId: number | null;
  mealCustomText: string | null;
  ingredientText: string;
  checked: boolean;
  sortOrder: number;
};

export type ShoppingList = {
  mealPlanId: number;
  items: ShoppingListItem[];
};

class ShoppingListService {
  async addItems(
    userId: number,
    mealPlanId: number,
    items: Array<{ recipeId: number | null; mealId: number | null; ingredientText: string }>,
  ): Promise<ShoppingListItem[]> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, mealPlanId),
    });

    if (!mealPlan) {
      throw createError({ statusCode: 404, message: 'Meal plan not found' });
    }

    if (mealPlan.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to modify this shopping list',
      });
    }

    await db.delete(shoppingListItems).where(eq(shoppingListItems.mealPlanId, mealPlanId));

    let sortOrder = 0;
    const itemsToInsert = items.map((item) => ({
      mealPlanId,
      recipeId: item.recipeId,
      mealId: item.mealId,
      ingredientText: item.ingredientText,
      sortOrder: sortOrder++,
      checked: false,
    }));

    await db.insert(shoppingListItems).values(itemsToInsert);

    const result = await db.query.shoppingListItems.findMany({
      where: eq(shoppingListItems.mealPlanId, mealPlanId),
      with: { recipe: true, meal: true },
      orderBy: (i, { asc }) => [asc(i.sortOrder)],
    });

    return result.map((item) => ({
      id: item.id,
      recipeId: item.recipeId,
      recipeName: item.recipe?.name ?? null,
      mealId: item.mealId,
      mealCustomText: item.meal?.customText ?? null,
      ingredientText: item.ingredientText,
      checked: item.checked,
      sortOrder: item.sortOrder,
    }));
  }

  async addManualItem(
    userId: number,
    mealPlanId: number,
    ingredientText: string,
  ): Promise<ShoppingListItem> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, mealPlanId),
    });

    if (!mealPlan) {
      throw createError({ statusCode: 404, message: 'Meal plan not found' });
    }

    if (mealPlan.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to modify this shopping list',
      });
    }

    const firstItem = await db.query.shoppingListItems.findFirst({
      where: and(eq(shoppingListItems.mealPlanId, mealPlanId), isNull(shoppingListItems.deletedAt)),
      orderBy: (i, { asc }) => [asc(i.sortOrder)],
    });

    const [inserted] = await db
      .insert(shoppingListItems)
      .values({
        mealPlanId,
        recipeId: null,
        mealId: null,
        ingredientText,
        sortOrder: (firstItem?.sortOrder ?? 0) - 1,
        checked: false,
      })
      .returning();

    if (!inserted) {
      throw createError({ statusCode: 500, message: 'Failed to add item' });
    }

    return {
      id: inserted.id,
      recipeId: null,
      recipeName: null,
      mealId: null,
      mealCustomText: null,
      ingredientText: inserted.ingredientText,
      checked: inserted.checked,
      sortOrder: inserted.sortOrder,
    };
  }

  async getActiveList(userId: number): Promise<ShoppingList | null> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.userId, userId),
    });

    if (!mealPlan) return null;

    const items = await db.query.shoppingListItems.findMany({
      where: and(
        eq(shoppingListItems.mealPlanId, mealPlan.id),
        isNull(shoppingListItems.deletedAt),
      ),
      with: { recipe: true, meal: true },
      orderBy: (i, { asc }) => [asc(i.sortOrder)],
    });

    if (items.length === 0) return null;

    return {
      mealPlanId: mealPlan.id,
      items: items.map((item) => ({
        id: item.id,
        recipeId: item.recipeId,
        recipeName: item.recipe?.name ?? null,
        mealId: item.mealId,
        mealCustomText: item.meal?.customText ?? null,
        ingredientText: item.ingredientText,
        checked: item.checked,
        sortOrder: item.sortOrder,
      })),
    };
  }

  async updateItem(
    itemId: number,
    userId: number,
    updates: { ingredientText?: string; checked?: boolean },
  ): Promise<ShoppingListItem> {
    const db = await getDb();

    const item = await db.query.shoppingListItems.findFirst({
      where: eq(shoppingListItems.id, itemId),
      with: { mealPlan: true, recipe: true, meal: true },
    });

    if (!item) {
      throw createError({ statusCode: 404, message: 'Shopping list item not found' });
    }

    if (item.mealPlan.userId !== userId) {
      throw createError({ statusCode: 403, message: 'Not authorized to update this item' });
    }

    const [updatedItem] = await db
      .update(shoppingListItems)
      .set({
        ...(updates.ingredientText !== undefined && {
          ingredientText: updates.ingredientText,
        }),
        ...(updates.checked !== undefined && { checked: updates.checked }),
      })
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    if (!updatedItem) {
      throw createError({ statusCode: 500, message: 'Failed to update item' });
    }

    return {
      id: updatedItem.id,
      recipeId: updatedItem.recipeId,
      recipeName: item.recipe?.name ?? null,
      mealId: updatedItem.mealId,
      mealCustomText: item.meal?.customText ?? null,
      ingredientText: updatedItem.ingredientText,
      checked: updatedItem.checked,
      sortOrder: updatedItem.sortOrder,
    };
  }

  async deleteItem(itemId: number, userId: number): Promise<void> {
    const db = await getDb();

    const item = await db.query.shoppingListItems.findFirst({
      where: eq(shoppingListItems.id, itemId),
      with: { mealPlan: true },
    });

    if (!item) {
      throw createError({ statusCode: 404, message: 'Shopping list item not found' });
    }

    if (item.mealPlan.userId !== userId) {
      throw createError({ statusCode: 403, message: 'Not authorized to delete this item' });
    }

    await db
      .update(shoppingListItems)
      .set({ deletedAt: new Date() })
      .where(eq(shoppingListItems.id, itemId));
  }

  async clearList(userId: number, mealPlanId: number): Promise<void> {
    const db = await getDb();

    const mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, mealPlanId),
    });

    if (!mealPlan) {
      throw createError({ statusCode: 404, message: 'Meal plan not found' });
    }

    if (mealPlan.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to delete this shopping list',
      });
    }

    await db.delete(shoppingListItems).where(eq(shoppingListItems.mealPlanId, mealPlanId));
  }
}

export const shoppingListService = new ShoppingListService();
