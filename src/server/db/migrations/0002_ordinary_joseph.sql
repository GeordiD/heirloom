CREATE TABLE "recipe_ingredient_substitutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"ingredient" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD COLUMN "do_not_use" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipe_ingredient_substitutions" ADD CONSTRAINT "recipe_ingredient_substitutions_ingredient_id_recipe_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."recipe_ingredients"("id") ON DELETE no action ON UPDATE no action;