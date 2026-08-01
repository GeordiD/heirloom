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
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (ingredientText: string) => Promise<void>;
}

export function AddShoppingListItemModal({ open, onClose, onAdd }: Props) {
  const [ingredientText, setIngredientText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIngredientText('');
      onClose();
    }
  };

  const handleAdd = async () => {
    const trimmed = ingredientText.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await onAdd(trimmed);
      setIngredientText('');
      onClose();
    } catch (err) {
      console.error('Failed to add shopping list item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="item-text">Item</Label>
          <Input
            id="item-text"
            value={ingredientText}
            disabled={isSaving}
            autoFocus
            placeholder="e.g. Paper towels"
            onChange={(e) => setIngredientText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isSaving} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSaving || !ingredientText.trim()} onClick={() => void handleAdd()}>
            {isSaving ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
