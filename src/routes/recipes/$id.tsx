import { EditIngredientsModal } from '#/components/recipe/EditIngredientsModal';
import { EditRecipeNameModal } from '#/components/recipe/EditRecipeNameModal';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { deleteRecipe, fetchRecipeById } from '#/server/functions/recipes.functions';
import type { recipeService } from '#/server/services/recipeService';
import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Link2, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/recipes/$id')({
  loader: async ({ params }) => {
    const recipe = await fetchRecipeById({ data: Number(params.id) });
    if (!recipe) throw notFound();
    return recipe;
  },
  component: RecipePage,
});

type RecipeDetail = NonNullable<Awaited<ReturnType<typeof recipeService.getRecipeById>>>;
type Ingredient = RecipeDetail['ingredients'][number]['items'][number];

function RecipePage() {
  const recipe = Route.useLoaderData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [isShowingDeleteConfirm, setIsShowingDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditIngredientsOpen, setIsEditIngredientsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe({ data: recipe.id });
      await navigate({ to: '/' });
    } catch {
      alert('Failed to delete recipe. Please try again.');
      setIsDeleting(false);
    } finally {
      setIsShowingDeleteConfirm(false);
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Top nav */}
      <div className="mb-4 flex h-10 items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="icon" aria-label="Back to recipes">
            <ChevronLeft size={20} />
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {isShowingDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Are you sure?</span>
              <Button variant="outline" size="sm" onClick={() => setIsShowingDeleteConfirm(false)}>
                No
              </Button>
              <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? 'Deleting…' : 'Yes'}
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy link to recipe"
                onClick={handleCopyLink}
              >
                <Link2 size={16} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More options">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem onSelect={() => setIsEditNameOpen(true)}>
                    Edit Recipe Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsEditIngredientsOpen(true)}>
                    Edit Recipe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setIsShowingDeleteConfirm(true)}
                  >
                    Delete Recipe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-foreground">{recipe.name}</h1>
          {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-2 lg:hidden">
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'ingredients' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
            onClick={() => setActiveTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'instructions' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
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

      <EditRecipeNameModal
        recipeId={recipe.id}
        currentName={recipe.name}
        open={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />
      <EditIngredientsModal
        recipe={recipe}
        open={isEditIngredientsOpen}
        onClose={() => setIsEditIngredientsOpen(false)}
      />
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
