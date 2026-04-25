CREATE TABLE "shopping_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_plan_id" integer NOT NULL,
	"recipe_id" integer,
	"ingredient_text" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_plan_days" DROP CONSTRAINT "meal_plan_days_meal_plan_id_meal_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_plan_meals" DROP CONSTRAINT "meal_plan_meals_day_id_meal_plan_days_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_ingredient_groups" DROP CONSTRAINT "recipe_ingredient_groups_recipe_id_recipes_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_ingredient_substitutions" DROP CONSTRAINT "recipe_ingredient_substitutions_ingredient_id_recipe_ingredients_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_group_id_recipe_ingredient_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_instructions" DROP CONSTRAINT "recipe_instructions_recipe_id_recipes_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe_notes" DROP CONSTRAINT "recipe_notes_recipe_id_recipes_id_fk";
--> statement-breakpoint
ALTER TABLE "token_usage" DROP CONSTRAINT "token_usage_recipe_id_recipes_id_fk";
--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_days" ADD CONSTRAINT "meal_plan_days_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_meals" ADD CONSTRAINT "meal_plan_meals_day_id_meal_plan_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."meal_plan_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient_groups" ADD CONSTRAINT "recipe_ingredient_groups_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient_substitutions" ADD CONSTRAINT "recipe_ingredient_substitutions_ingredient_id_recipe_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."recipe_ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_group_id_recipe_ingredient_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."recipe_ingredient_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_instructions" ADD CONSTRAINT "recipe_instructions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;