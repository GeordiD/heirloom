import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { removeMeal, updateMealCustomText } from '#/server/functions/mealPlan.functions';
import type { MealPlanMeal, MealType } from '#/server/services/mealPlanService';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { MealPlanRecipeModal } from './MealPlanRecipeModal';

interface Props {
  dayId: number;
  mealType: MealType;
  meals: MealPlanMeal[];
}

export function MealPlanMealSlot({ dayId, mealType, meals }: Props) {
  const queryClient = useQueryClient();
  const label = mealType === 'lunch' ? 'L' : 'D';

  const [editingMealId, setEditingMealId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  function startEditing(meal: MealPlanMeal) {
    setEditingMealId(meal.id);
    setEditingText(meal.customText ?? '');
  }

  function cancelEditing() {
    setEditingMealId(null);
    setEditingText('');
  }

  async function saveEditing(mealId: number) {
    const trimmed = editingText.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    try {
      await updateMealCustomText({ data: { mealId, customText: trimmed } });
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
    } catch (err) {
      console.error('Failed to update meal:', err);
    } finally {
      setEditingMealId(null);
      setEditingText('');
    }
  }

  async function handleRemoveMeal(mealId: number) {
    try {
      await removeMeal({ data: { mealId } });
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] });
    } catch (err) {
      console.error('Failed to remove meal:', err);
    }
  }

  return (
    <div className="space-y-1">
      {meals.length === 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-6 font-medium text-foreground">{label}</div>
          <div className="flex-1 text-sm text-muted-foreground">No meals</div>
          <div className="w-8">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      ) : (
        meals.map((meal, index) => (
          <div key={meal.id} className="flex items-center gap-3">
            <div className="w-6 font-medium text-foreground">{index === 0 ? label : ''}</div>

            <div className="flex-1 flex items-center justify-between bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded text-sm">
              {meal.recipeId ? (
                <a
                  href={`/recipes/${meal.recipeId}`}
                  className="flex-1 text-foreground hover:text-primary"
                >
                  {meal.recipeName}
                </a>
              ) : editingMealId === meal.id ? (
                <Input
                  value={editingText}
                  className="h-6 flex-1 text-sm"
                  autoFocus
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveEditing(meal.id);
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  onBlur={cancelEditing}
                />
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-2 text-foreground hover:text-primary flex-1 text-left"
                  onClick={() => startEditing(meal)}
                >
                  <Pencil size={14} className="text-muted-foreground shrink-0" />
                  {meal.customText}
                </button>
              )}

              {editingMealId === meal.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-1"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void saveEditing(meal.id)}
                >
                  <Check size={14} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-1"
                  onClick={() => void handleRemoveMeal(meal.id)}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            <div className="w-8">
              {index === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={16} />
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      <MealPlanRecipeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dayId={dayId}
        mealType={mealType}
      />
    </div>
  );
}
