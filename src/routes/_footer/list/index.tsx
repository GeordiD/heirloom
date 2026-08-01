import { AddShoppingListItemModal } from '#/components/shopping-list/AddShoppingListItemModal';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import {
  addShoppingListItem,
  deleteShoppingListItem,
  fetchShoppingList,
  updateShoppingListItem,
} from '#/server/functions/shoppingList.functions';
import type { ShoppingList } from '#/server/services/shoppingListService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const shoppingListQueryOptions = {
  queryKey: ['shopping-list'] as const,
  queryFn: fetchShoppingList,
};

export const Route = createFileRoute('/_footer/list/')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(shoppingListQueryOptions),
  component: ShoppingListPage,
});

function ShoppingListPage() {
  const queryClient = useQueryClient();
  const { data: shoppingList, isPending, error } = useQuery(shoppingListQueryOptions);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const addMutation = useMutation({
    mutationFn: (ingredientText: string) => addShoppingListItem({ data: { ingredientText } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: number; checked: boolean }) => updateShoppingListItem({ data: vars }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list'] });
      const previous = queryClient.getQueryData<ShoppingList | null>(['shopping-list']);
      queryClient.setQueryData<ShoppingList | null>(['shopping-list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === vars.id ? { ...item, checked: vars.checked } : item,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['shopping-list'], context.previous);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingListItem({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-list'] });
      const previous = queryClient.getQueryData<ShoppingList | null>(['shopping-list']);
      queryClient.setQueryData<ShoppingList | null>(['shopping-list'], (old) => {
        if (!old) return old;
        return { ...old, items: old.items.filter((item) => item.id !== id) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['shopping-list'], context.previous);
      }
    },
  });

  const items = shoppingList?.items ?? [];

  return (
    <>
      <div className="flex flex-col max-w-[414px] mx-auto">
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Shopping List</h1>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Button
                variant="secondary"
                size="icon"
                aria-label="Done editing"
                onClick={() => setIsEditMode(false)}
              >
                <Check size={20} />
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Add item"
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus size={20} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label="More options">
                      <MoreVertical size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8}>
                    <DropdownMenuItem onSelect={() => setIsEditMode(true)}>
                      Edit list
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4">
          {isPending && !shoppingList ? (
            <div className="flex justify-center py-12">
              <div className="text-muted-foreground">Loading shopping list...</div>
            </div>
          ) : error && !shoppingList ? (
            <div className="py-12 text-center text-destructive">
              <p>Failed to load shopping list. Please try again later.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-lg">No items in your shopping list</p>
              <Button className="mt-4" asChild>
                <a href="/meal-plan">Go to Meal Plan</a>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 py-2 transition-opacity${item.checked ? ' opacity-50' : ''}`}
                >
                  <button
                    type="button"
                    className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors${
                      item.checked ? ' border-primary bg-primary' : ' border-muted-foreground/40'
                    }`}
                    onClick={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                  >
                    {item.checked && (
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-foreground text-base break-words${item.checked ? ' line-through' : ''}`}
                    >
                      {item.ingredientText}
                    </p>
                    {(item.recipeName ?? item.mealCustomText) && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {item.recipeName ?? item.mealCustomText}
                      </p>
                    )}
                  </div>

                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete item"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      <AddShoppingListItemModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={async (ingredientText) => {
          await addMutation.mutateAsync(ingredientText);
        }}
      />
    </>
  );
}
