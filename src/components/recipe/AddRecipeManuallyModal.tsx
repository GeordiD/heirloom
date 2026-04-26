import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { cn } from '#/lib/utils';
import { addRecipeManually } from '#/server/functions/recipes.functions';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface ListItem {
  id: number;
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddRecipeManuallyModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const idCounter = useRef(0);
  const newId = () => ++idCounter.current;

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<ListItem[]>(() => [{ id: 0, text: '' }]);
  const [instructions, setInstructions] = useState<ListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = name.trim().length > 0 && ingredients.some((i) => i.text.trim().length > 0);

  const addIngredient = () => setIngredients((prev) => [...prev, { id: newId(), text: '' }]);
  const removeIngredient = (id: number) =>
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  const updateIngredient = (id: number, text: string) =>
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));

  const addInstruction = () => setInstructions((prev) => [...prev, { id: newId(), text: '' }]);
  const removeInstruction = (id: number) =>
    setInstructions((prev) => prev.filter((i) => i.id !== id));
  const updateInstruction = (id: number, text: string) =>
    setInstructions((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));

  const resetState = () => {
    setName('');
    setIngredients([{ id: newId(), text: '' }]);
    setInstructions([]);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleClose();
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setIsSaving(true);
    setError('');
    try {
      const result = await addRecipeManually({
        data: {
          name: name.trim(),
          ingredients: ingredients.map((i) => i.text.trim()).filter((t) => t.length > 0),
          instructions: instructions.map((i) => i.text.trim()).filter((t) => t.length > 0),
        },
      });
      handleClose();
      await navigate({ to: '/recipes/$id', params: { id: String(result.id) } });
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Recipe Manually</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-1">
            <Label htmlFor="manual-recipe-name">Recipe Name</Label>
            <Input
              id="manual-recipe-name"
              value={name}
              placeholder="e.g. Spaghetti Carbonara"
              disabled={isSaving}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredients</Label>
            {ingredients.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  value={item.text}
                  placeholder="e.g. 2 cups flour"
                  disabled={isSaving}
                  className="flex-1"
                  onChange={(e) => updateIngredient(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSaving || ingredients.length === 1}
                  onClick={() => removeIngredient(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" disabled={isSaving} onClick={addIngredient}>
              <Plus className="size-4" />
              Add Ingredient
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions</Label>
            {instructions.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="mt-2 w-5 shrink-0 text-right text-sm text-muted-foreground">
                  {index + 1}.
                </span>
                <textarea
                  value={item.text}
                  placeholder="Describe this step..."
                  disabled={isSaving}
                  rows={2}
                  className={cn(
                    'flex-1 min-w-0 resize-none rounded-md border border-input bg-transparent px-3 py-1.5 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  )}
                  onChange={(e) => updateInstruction(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addInstruction();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSaving}
                  onClick={() => removeInstruction(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" disabled={isSaving} onClick={addInstruction}>
              <Plus className="size-4" />
              Add Step
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isSaving} onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={!isFormValid || isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving…' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
