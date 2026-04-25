CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "ingredient_id" integer;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "quantity" text;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "note" text;--> statement-breakpoint
CREATE INDEX "ingredients_name_idx" ON "ingredients" USING btree ("name");--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;