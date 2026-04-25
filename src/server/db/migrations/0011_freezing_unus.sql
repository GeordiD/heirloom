ALTER TABLE "meal_plan_meals" ALTER COLUMN "recipe_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_plan_meals" ADD COLUMN "custom_text" text;