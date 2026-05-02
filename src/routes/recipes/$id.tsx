import { RecipeTopNav } from '#/components/recipe/RecipeTopNav';
import { Badge } from '#/components/ui/badge';
import { useShowFooter } from '#/contexts/FooterContext';
import { fetchRecipeById } from '#/server/functions/recipes.functions';
import type { RecipeDetail } from '#/server/services/recipeService';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/recipes/$id')({
  loader: async ({ params }) => {
    const recipe = await fetchRecipeById({ data: Number(params.id) });
    if (!recipe) throw notFound();
    return recipe;
  },
  component: RecipePage,
});

type Ingredient = RecipeDetail['ingredients'][number]['items'][number];

function RecipePage() {
  useShowFooter(false);
  const recipe = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <RecipeTopNav recipe={recipe} />

      <div className="flex flex-col gap-4 pb-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-foreground">{recipe.name}</h1>
          {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-2 lg:hidden">
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'ingredients' ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-accent/50'}`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'instructions' ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-accent/50'}`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
        </div>

        <hr className="border-border" />

        {/* Mobile: tab-based layout */}
        <div className="flex flex-col lg:hidden">
          {activeTab === 'ingredients' && <RecipeIngredients recipe={recipe} />}
          {activeTab === 'instructions' && (
            <div className="flex flex-col gap-4">
              <RecipeInstructions recipe={recipe} />
              <RecipeNotes recipe={recipe} />
            </div>
          )}
        </div>

        {/* Desktop: two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
          <RecipeIngredients recipe={recipe} />
          <div className="flex flex-col gap-4">
            <RecipeInstructions recipe={recipe} />
            <RecipeNotes recipe={recipe} />
          </div>
        </div>
      </div>
    </main>
  );
}

type RecipeSectionProps = { recipe: RecipeDetail };

function RecipeIngredients({ recipe }: RecipeSectionProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-foreground">Ingredients</h2>
      <div className="space-y-6">
        {recipe.ingredients.map((group, index) => (
          <div key={index} className="space-y-2">
            {group.name && (
              <h3 className="border-b border-border pb-1 text-lg font-semibold text-muted-foreground">
                {group.name}
              </h3>
            )}
            <ul className="flex flex-col gap-2">
              {group.items.map((ingredient, itemIndex) => (
                <IngredientItem key={itemIndex} ingredient={ingredient} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function IngredientItem({ ingredient }: { ingredient: Ingredient }) {
  return (
    <li className="flex min-h-8 items-start">
      <span
        className={
          ingredient.isUnused
            ? 'line-through text-muted-foreground'
            : ingredient.isSubstituted
              ? 'text-primary'
              : 'text-foreground'
        }
      >
        {ingredient.name}
      </span>
    </li>
  );
}

function RecipeInstructions({ recipe }: RecipeSectionProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-foreground">Instructions</h2>
      <ol className="space-y-4">
        {recipe.instructions.map((instruction, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="leading-relaxed text-foreground">{instruction}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecipeNotes({ recipe }: RecipeSectionProps) {
  if (!recipe.notes.length) return null;

  return (
    <div className="border-t border-border pt-4">
      <h2 className="mb-4 text-2xl font-bold text-foreground">Notes</h2>
      <div className="rounded-lg bg-muted p-4">
        <ul className="space-y-2">
          {recipe.notes.map((note, index) => (
            <li key={index} className="text-foreground">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
