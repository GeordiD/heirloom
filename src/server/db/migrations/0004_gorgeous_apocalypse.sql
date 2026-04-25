ALTER TABLE "meal_plans" ALTER COLUMN "week_start_day" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "meal_plans" ALTER COLUMN "week_start_day" SET DATA TYPE "public"."day_of_week" USING "week_start_day"::text::"public"."day_of_week";--> statement-breakpoint
ALTER TABLE "meal_plans" ALTER COLUMN "week_start_day" SET DEFAULT 'sunday';--> statement-breakpoint
DROP TYPE "public"."week_start_day";