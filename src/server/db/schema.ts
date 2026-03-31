import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  foreignKey,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Enums
export const dayOfWeekEnum = pgEnum('day_of_week', [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);
export const mealTypeEnum = pgEnum('meal_type', ['lunch', 'dinner']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  prepTime: text('prep_time'),
  cookTime: text('cook_time'),
  totalTime: text('total_time'),
  servings: text('servings'),
  cuisine: text('cuisine'),
  sourceUrl: text('source_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const recipeIngredientGroups = pgTable(
  'recipe_ingredient_groups',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id').notNull(),
    name: text('name'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete('cascade'),
  ],
);

export const ingredients = pgTable(
  'ingredients',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => [index('ingredients_name_idx').on(table.name)],
);

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: serial('id').primaryKey(),
    groupId: integer('group_id').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    doNotUse: boolean('do_not_use').default(false),

    /** @deprecated reference ingredientId instead */
    ingredient: text('ingredient').notNull(),

    ingredientId: integer('ingredient_id'),
    quantity: text('quantity'),
    unit: text('unit'),
    note: text('note'),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [recipeIngredientGroups.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.ingredientId],
      foreignColumns: [ingredients.id],
    }).onDelete('set null'),
  ],
);

export const recipeIngredientSubstitutions = pgTable(
  'recipe_ingredient_substitutions',
  {
    id: serial('id').primaryKey(),
    ingredientId: integer('ingredient_id').notNull(),
    ingredient: text('ingredient').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.ingredientId],
      foreignColumns: [recipeIngredients.id],
    }).onDelete('cascade'),
  ],
);

export const recipeInstructions = pgTable(
  'recipe_instructions',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id').notNull(),
    instruction: text('instruction').notNull(),
    stepNumber: integer('step_number').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete('cascade'),
  ],
);

export const recipeNotes = pgTable(
  'recipe_notes',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id').notNull(),
    note: text('note').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete('cascade'),
  ],
);

export const tokenUsage = pgTable(
  'token_usage',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    totalTokens: integer('total_tokens').notNull(),
    inputCost: decimal('input_cost', { precision: 10, scale: 6 }).notNull(),
    outputCost: decimal('output_cost', { precision: 10, scale: 6 }).notNull(),
    totalCost: decimal('total_cost', { precision: 10, scale: 6 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete('cascade'),
  ],
);

export const mealPlans = pgTable(
  'meal_plans',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    weekStartDay: dayOfWeekEnum('week_start_day').notNull().default('sunday'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
  ],
);

export const mealPlanDays = pgTable(
  'meal_plan_days',
  {
    id: serial('id').primaryKey(),
    mealPlanId: integer('meal_plan_id').notNull(),
    dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
    date: date('date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.mealPlanId],
      foreignColumns: [mealPlans.id],
    }).onDelete('cascade'),
  ],
);

export const mealPlanMeals = pgTable(
  'meal_plan_meals',
  {
    id: serial('id').primaryKey(),
    dayId: integer('day_id').notNull(),
    mealType: mealTypeEnum('meal_type').notNull(),
    recipeId: integer('recipe_id'),
    customText: text('custom_text'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dayId],
      foreignColumns: [mealPlanDays.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }),
  ],
);

export const shoppingListItems = pgTable(
  'shopping_list_items',
  {
    id: serial('id').primaryKey(),
    mealPlanId: integer('meal_plan_id').notNull(),
    recipeId: integer('recipe_id'),
    mealId: integer('meal_id'),
    ingredientText: text('ingredient_text').notNull(),
    checked: boolean('checked').default(false).notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.mealPlanId],
      foreignColumns: [mealPlans.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
    }),
    foreignKey({
      columns: [table.mealId],
      foreignColumns: [mealPlanMeals.id],
    }).onDelete('set null'),
  ],
);

export const job = pgTable('job', {
  id: serial('id').primaryKey(),
  workflowName: text('workflow_name').notNull(),
  metadata: json('metadata'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const step = pgTable(
  'step',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id').notNull(),
    name: text('name').notNull(),
    input: json('input'),
    output: json('output'),
    error: json('error'),
    metadata: json('metadata'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    parentStepId: integer('parent_step_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.jobId],
      foreignColumns: [job.id],
    }),
    foreignKey({
      columns: [table.parentStepId],
      foreignColumns: [table.id],
    }),
  ],
);

// Relations
export const recipesRelations = relations(recipes, ({ many, one }) => ({
  ingredientGroups: many(recipeIngredientGroups),
  instructions: many(recipeInstructions),
  notes: many(recipeNotes),
  tokenUsage: one(tokenUsage),
}));

export const recipeIngredientGroupsRelations = relations(
  recipeIngredientGroups,
  ({ one, many }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredientGroups.recipeId],
      references: [recipes.id],
    }),
    ingredients: many(recipeIngredients),
  }),
);

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one, many }) => ({
  group: one(recipeIngredientGroups, {
    fields: [recipeIngredients.groupId],
    references: [recipeIngredientGroups.id],
  }),
  standardizedIngredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
  substitutions: many(recipeIngredientSubstitutions),
}));

export const recipeInstructionsRelations = relations(recipeInstructions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeInstructions.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeNotesRelations = relations(recipeNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeNotes.recipeId],
    references: [recipes.id],
  }),
}));

export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
  recipe: one(recipes, {
    fields: [tokenUsage.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeIngredientSubstitutionsRelations = relations(
  recipeIngredientSubstitutions,
  ({ one }) => ({
    ingredient: one(recipeIngredients, {
      fields: [recipeIngredientSubstitutions.ingredientId],
      references: [recipeIngredients.id],
    }),
  }),
);

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  days: many(mealPlanDays),
}));

export const mealPlanDaysRelations = relations(mealPlanDays, ({ one, many }) => ({
  mealPlan: one(mealPlans, {
    fields: [mealPlanDays.mealPlanId],
    references: [mealPlans.id],
  }),
  meals: many(mealPlanMeals),
}));

export const mealPlanMealsRelations = relations(mealPlanMeals, ({ one }) => ({
  day: one(mealPlanDays, {
    fields: [mealPlanMeals.dayId],
    references: [mealPlanDays.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlanMeals.recipeId],
    references: [recipes.id],
  }),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [shoppingListItems.mealPlanId],
    references: [mealPlans.id],
  }),
  recipe: one(recipes, {
    fields: [shoppingListItems.recipeId],
    references: [recipes.id],
  }),
  meal: one(mealPlanMeals, {
    fields: [shoppingListItems.mealId],
    references: [mealPlanMeals.id],
  }),
}));
