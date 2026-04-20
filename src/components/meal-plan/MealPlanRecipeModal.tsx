import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { fetchRecipes } from '#/server/functions/recipes.functions';
import { addMealToDay } from '#/server/functions/mealPlan.functions';
import type { MealType } from '#/server/services/mealPlanService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  dayId: number;
  mealType: MealType;
}

export function MealPlanRecipeModal({ open, onClose, dayId, mealType }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'] as const,
    queryFn: fetchRecipes,
  });

  const filtered = search
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  function toggleRecipe(recipeId: number) {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId],
    );
  }

  async function handleSelect() {
    setIsSaving(true);
    try {
      for (const recipeId of selectedRecipeIds) {
        await addMealToDay({ data: { dayId, mealType, recipeId } });
      }
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
      handleClose();
    } catch (err) {
      console.error('Failed to add recipes:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddWithoutRecipe() {
    const customText = search.trim() || 'Leftovers';
    setIsSaving(true);
    try {
      await addMealToDay({ data: { dayId, mealType, customText } });
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
      handleClose();
    } catch (err) {
      console.error('Failed to add custom meal:', err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    setSearch('');
    setSelectedRecipeIds([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Recipes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            variant="outline"
            className="w-full"
            disabled={isSaving}
            onClick={() => void handleAddWithoutRecipe()}
          >
            <Plus size={16} />
            Add &ldquo;{search.trim() || 'Leftovers'}&rdquo; without recipe
          </Button>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recipes found</div>
            ) : (
              filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded border border-border hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                  onClick={() => toggleRecipe(recipe.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipeIds.includes(recipe.id)}
                    onChange={() => toggleRecipe(recipe.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{recipe.name}</div>
                    {recipe.cuisine && (
                      <div className="text-sm text-muted-foreground">{recipe.cuisine}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isSaving} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={isSaving || selectedRecipeIds.length === 0}
            onClick={() => void handleSelect()}
          >
            {selectedRecipeIds.length > 0 ? `Add (${selectedRecipeIds.length})` : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
