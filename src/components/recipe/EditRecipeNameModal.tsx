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
import { updateRecipeName } from '#/server/functions/recipes.functions';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';

interface Props {
  recipeId: number;
  currentName: string;
  open: boolean;
  onClose: () => void;
}

export function EditRecipeNameModal({ recipeId, currentName, open, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await updateRecipeName({ data: { id: recipeId, name: trimmed } });
      await router.invalidate();
      onClose();
    } catch (err) {
      console.error('Failed to update recipe name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recipe Name</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="recipe-name">Recipe name</Label>
          <Input
            id="recipe-name"
            value={name}
            disabled={isSaving}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

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
