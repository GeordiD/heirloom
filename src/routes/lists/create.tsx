import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import {
  addShoppingListItems,
  fetchShoppingListCreationData,
} from '#/server/functions/shoppingList.functions';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const creationDataQueryOptions = {
  queryKey: ['shopping-list-creation-data'] as const,
  queryFn: fetchShoppingListCreationData,
};

export const Route = createFileRoute('/lists/create')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(creationDataQueryOptions),
  component: CreateShoppingListPage,
});

type SelectableIngredient = {
  id: number;
  text: string;
  selected: boolean;
};

type RecipeStep = {
  recipeId: number;
  name: string;
  ingredients: SelectableIngredient[];
  additionalIngredients: SelectableIngredient[];
  nextAdditionalId: number;
};

type CustomMealStep = {
  mealId: number;
  name: string;
  ingredients: SelectableIngredient[];
  nextIngredientId: number;
};

function CreateShoppingListPage() {
  const navigate = useNavigate();
  const { data, isPending, error } = useQuery(creationDataQueryOptions);

  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>(() =>
    (data?.recipes ?? []).map((recipe) => ({
      recipeId: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients.map((ing) => ({
        id: ing.id,
        text: ing.text,
        selected: false,
      })),
      additionalIngredients: [],
      nextAdditionalId: 1,
    })),
  );

  const [customMealSteps, setCustomMealSteps] = useState<CustomMealStep[]>(() =>
    (data?.customMeals ?? []).map((meal) => ({
      mealId: meal.mealId,
      name: meal.name,
      ingredients: [],
      nextIngredientId: 1,
    })),
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [additionalIngredientText, setAdditionalIngredientText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = recipeSteps.length + customMealSteps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isRecipeStep = currentStep < recipeSteps.length;
  const currentRecipe = isRecipeStep ? recipeSteps[currentStep] : null;
  const currentCustomMeal = !isRecipeStep
    ? customMealSteps[currentStep - recipeSteps.length]
    : null;

  function goBack() {
    if (!isFirstStep) {
      setAdditionalIngredientText('');
      setCurrentStep((s) => s - 1);
    }
  }

  async function goNext() {
    if (isLastStep) {
      await finish();
    } else {
      setAdditionalIngredientText('');
      setCurrentStep((s) => s + 1);
    }
  }

  // Recipe ingredient actions
  function toggleIngredient(ingredientId: number) {
    if (currentRecipe === null) return;
    setRecipeSteps((steps) =>
      steps.map((step, i) =>
        i !== currentStep
          ? step
          : {
              ...step,
              ingredients: step.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, selected: !ing.selected } : ing,
              ),
            },
      ),
    );
  }

  function updateIngredientText(ingredientId: number, text: string) {
    if (currentRecipe === null) return;
    setRecipeSteps((steps) =>
      steps.map((step, i) =>
        i !== currentStep
          ? step
          : {
              ...step,
              ingredients: step.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, text } : ing,
              ),
            },
      ),
    );
  }

  function addAdditionalIngredient() {
    const trimmed = additionalIngredientText.trim();
    if (currentRecipe === null || !trimmed) return;
    setRecipeSteps((steps) =>
      steps.map((step, i) =>
        i !== currentStep
          ? step
          : {
              ...step,
              additionalIngredients: [
                ...step.additionalIngredients,
                { id: step.nextAdditionalId, text: trimmed, selected: true },
              ],
              nextAdditionalId: step.nextAdditionalId + 1,
            },
      ),
    );
    setAdditionalIngredientText('');
  }

  function toggleAdditionalIngredient(ingredientId: number) {
    if (currentRecipe === null) return;
    setRecipeSteps((steps) =>
      steps.map((step, i) =>
        i !== currentStep
          ? step
          : {
              ...step,
              additionalIngredients: step.additionalIngredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, selected: !ing.selected } : ing,
              ),
            },
      ),
    );
  }

  function updateAdditionalIngredientText(ingredientId: number, text: string) {
    if (currentRecipe === null) return;
    setRecipeSteps((steps) =>
      steps.map((step, i) =>
        i !== currentStep
          ? step
          : {
              ...step,
              additionalIngredients: step.additionalIngredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, text } : ing,
              ),
            },
      ),
    );
  }

  // Custom meal ingredient actions
  function addCustomIngredient() {
    if (currentCustomMeal === null) return;
    const customMealIndex = currentStep - recipeSteps.length;
    setCustomMealSteps((steps) =>
      steps.map((step, i) =>
        i !== customMealIndex
          ? step
          : {
              ...step,
              ingredients: [
                ...step.ingredients,
                { id: step.nextIngredientId, text: '', selected: true },
              ],
              nextIngredientId: step.nextIngredientId + 1,
            },
      ),
    );
  }

  function toggleCustomIngredient(ingredientId: number) {
    if (currentCustomMeal === null) return;
    const customMealIndex = currentStep - recipeSteps.length;
    setCustomMealSteps((steps) =>
      steps.map((step, i) =>
        i !== customMealIndex
          ? step
          : {
              ...step,
              ingredients: step.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, selected: !ing.selected } : ing,
              ),
            },
      ),
    );
  }

  function updateCustomIngredientText(ingredientId: number, text: string) {
    if (currentCustomMeal === null) return;
    const customMealIndex = currentStep - recipeSteps.length;
    setCustomMealSteps((steps) =>
      steps.map((step, i) =>
        i !== customMealIndex
          ? step
          : {
              ...step,
              ingredients: step.ingredients.map((ing) =>
                ing.id === ingredientId ? { ...ing, text } : ing,
              ),
            },
      ),
    );
  }

  function removeCustomIngredient(ingredientId: number) {
    if (currentCustomMeal === null) return;
    const customMealIndex = currentStep - recipeSteps.length;
    setCustomMealSteps((steps) =>
      steps.map((step, i) =>
        i !== customMealIndex
          ? step
          : {
              ...step,
              ingredients: step.ingredients.filter((ing) => ing.id !== ingredientId),
            },
      ),
    );
  }

  async function finish() {
    if (!data) return;
    setSubmitting(true);

    try {
      const items: Array<{
        recipeId: number | null;
        mealId: number | null;
        ingredientText: string;
      }> = [];

      for (const step of recipeSteps) {
        for (const ing of step.ingredients) {
          if (ing.selected) {
            items.push({ recipeId: step.recipeId, mealId: null, ingredientText: ing.text });
          }
        }
        for (const ing of step.additionalIngredients) {
          if (ing.selected && ing.text.trim()) {
            items.push({ recipeId: step.recipeId, mealId: null, ingredientText: ing.text });
          }
        }
      }

      for (const step of customMealSteps) {
        for (const ing of step.ingredients) {
          if (ing.selected && ing.text.trim()) {
            items.push({ recipeId: null, mealId: step.mealId, ingredientText: ing.text });
          }
        }
      }

      if (items.length > 0) {
        await addShoppingListItems({ data: { mealPlanId: data.mealPlanId, items } });
      }

      await navigate({ to: '/lists' });
    } catch (err) {
      console.error('Failed to create shopping list:', err);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-[414px] mx-auto">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">Select Ingredients</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Loading recipes...</div>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">
            <p>Failed to load meal plan. Please try again later.</p>
          </div>
        ) : totalSteps === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">No meals in your meal plan</p>
            <Button asChild>
              <a href="/meal-plan">Go to Meal Plan</a>
            </Button>
          </div>
        ) : currentRecipe !== null ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{currentRecipe.name}</h2>
              <p className="text-muted-foreground">Select ingredients to add to list</p>
            </div>

            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </div>

            <div className="space-y-3">
              {currentRecipe.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={ingredient.selected}
                    onChange={() => toggleIngredient(ingredient.id)}
                    className="mt-2.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <Input
                      value={ingredient.text}
                      onChange={(e) => updateIngredientText(ingredient.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {currentRecipe.ingredients.length === 0 &&
                currentRecipe.additionalIngredients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No ingredients available for this recipe
                  </div>
                )}

              {currentRecipe.additionalIngredients.map((ingredient) => (
                <div key={`additional-${ingredient.id}`} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={ingredient.selected}
                    onChange={() => toggleAdditionalIngredient(ingredient.id)}
                    className="mt-2.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <Input
                      value={ingredient.text}
                      onChange={(e) =>
                        updateAdditionalIngredientText(ingredient.id, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3">
                <div className="w-4" />
                <div className="flex-1">
                  <Input
                    value={additionalIngredientText}
                    placeholder="Additional ingredient..."
                    onChange={(e) => setAdditionalIngredientText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addAdditionalIngredient();
                    }}
                  />
                </div>
                {additionalIngredientText.trim() && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1"
                    onClick={addAdditionalIngredient}
                  >
                    <Check size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : currentCustomMeal !== null ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pencil size={20} className="text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground">{currentCustomMeal.name}</h2>
              </div>
              <p className="text-muted-foreground">Add any ingredients you need for this meal</p>
            </div>

            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </div>

            <Button variant="outline" onClick={addCustomIngredient}>
              <Plus size={16} />
              Add Ingredient
            </Button>

            <div className="space-y-3">
              {currentCustomMeal.ingredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ingredients added yet. Click &ldquo;Add Ingredient&rdquo; to add items.
                </div>
              ) : (
                currentCustomMeal.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={ingredient.selected}
                      onChange={() => toggleCustomIngredient(ingredient.id)}
                      className="mt-2.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <Input
                        value={ingredient.text}
                        placeholder="Enter ingredient..."
                        onChange={(e) => updateCustomIngredientText(ingredient.id, e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mt-1"
                      onClick={() => removeCustomIngredient(ingredient.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="sticky bottom-0 z-10 bg-background border-t border-border px-4 py-4">
        <div className="flex gap-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={submitting}
              onClick={() => goBack()}
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            className={isFirstStep ? 'w-full' : 'flex-1'}
            disabled={submitting || isPending || totalSteps === 0}
            onClick={() => void goNext()}
          >
            {submitting ? 'Saving...' : isLastStep ? 'Finish' : 'Next'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
