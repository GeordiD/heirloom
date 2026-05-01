import { EditIngredientsModal } from '#/components/recipe/EditIngredientsModal';
import { EditRecipeNameModal } from '#/components/recipe/EditRecipeNameModal';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { deleteRecipe } from '#/server/functions/recipes.functions';
import { RecipeDetail } from '#/server/services/recipeService';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeft, Link2, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export function RecipeTopNav({ recipe }: { recipe: RecipeDetail }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShowingDeleteConfirm, setIsShowingDeleteConfirm] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditIngredientsOpen, setIsEditIngredientsOpen] = useState(false);
  const router = useRouter();

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
    void navigator.clipboard.writeText(recipe.sourceUrl);
  };

  return (
    <>
      <div className="mb-4 flex h-10 items-center justify-between">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Back to recipes"
          onClick={() => router.history.back()}
        >
          <ChevronLeft size={20} />
        </Button>

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
              {recipe.sourceUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Copy link to recipe"
                  onClick={handleCopyLink}
                >
                  <Link2 size={16} />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" aria-label="More options">
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
    </>
  );
}
