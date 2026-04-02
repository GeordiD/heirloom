import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import {
  markIngredientDoNotUse,
  upsertIngredientSubstitution,
} from '#/server/functions/recipes.functions';
import type { recipeService } from '#/server/services/recipeService';
import { useRouter } from '@tanstack/react-router';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

type RecipeDetail = NonNullable<Awaited<ReturnType<typeof recipeService.getRecipeById>>>;

interface FlatIngredient {
  id: number;
  name: string;
  originalName: string;
  isDeleted: boolean;
}

function flattenIngredients(recipe: RecipeDetail): FlatIngredient[] {
  return recipe.ingredients.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      name: item.name ?? '',
      originalName: item.name ?? '',
      isDeleted: item.isUnused ?? false,
    })),
  );
}

interface Props {
  recipe: RecipeDetail;
  open: boolean;
  onClose: () => void;
}

export function EditIngredientsModal({ recipe, open, onClose }: Props) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<FlatIngredient[]>(() =>
    flattenIngredients(recipe),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDeleteOrRestore = async (id: number, value: boolean) => {
    try {
      await markIngredientDoNotUse({ data: { id, value } });
      await router.invalidate();
      setIngredients(ingredients.map((x) => (x.id === id ? { ...x, isDeleted: value } : x)));
    } catch (err) {
      console.error('Failed to remove ingredient:', err);
    }
  };

  const handleSave = async () => {
    const modified = ingredients.filter((ing) => ing.name !== ing.originalName);
    if (modified.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await Promise.all(
        modified.map((ing) =>
          upsertIngredientSubstitution({
            data: { recipeIngredientId: ing.id, ingredient: ing.name },
          }),
        ),
      );
      await router.invalidate();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save ingredients';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIngredients(flattenIngredients(recipe));
      setErrorMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ingredients</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 space-y-3.5 overflow-y-auto">
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center gap-2">
              <Input
                value={ingredient.name}
                disabled={isSaving}
                className={['flex-1', ingredient.isDeleted ? 'line-through' : undefined].join(' ')}
                onChange={(e) =>
                  setIngredients((prev) =>
                    prev.map((ing) =>
                      ing.id === ingredient.id ? { ...ing, name: e.target.value } : ing,
                    ),
                  )
                }
              />
              {ingredient.isDeleted ? (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSaving}
                  onClick={() => void handleDeleteOrRestore(ingredient.id, false)}
                  aria-label="Restore ingredient"
                >
                  <RefreshCw size={16} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSaving}
                  onClick={() => void handleDeleteOrRestore(ingredient.id, true)}
                  aria-label="Remove ingredient"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>

        {errorMessage && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}

        <DialogFooter>
          <Button variant="ghost" disabled={isSaving} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
