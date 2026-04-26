import { Footer } from '#/components/Footer';
import { Button } from '#/components/ui/button';
import {
  fetchShoppingList,
  updateShoppingListItem,
} from '#/server/functions/shoppingList.functions';
import type { ShoppingList } from '#/server/services/shoppingListService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

const shoppingListQueryOptions = {
  queryKey: ['shopping-list'] as const,
  queryFn: fetchShoppingList,
};

export const Route = createFileRoute('/lists/')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(shoppingListQueryOptions),
  component: ShoppingListPage,
});

function ShoppingListPage() {
  const queryClient = useQueryClient();
  const { data: shoppingList, isPending, error } = useQuery(shoppingListQueryOptions);

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

  const items = shoppingList?.items ?? [];

  return (
    <>
      <div className="flex flex-col h-screen max-w-[414px] mx-auto">
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Shopping List</h1>
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
                </li>
              ))}
            </ul>
          )}
        </main>

        <footer className="sticky bottom-0 z-10 bg-background border-t border-border px-4 py-4">
          <Button size="lg" className="w-full" asChild>
            <a href="/meal-plan">Back to Meal Plan</a>
          </Button>
        </footer>
      </div>
      <Footer />
    </>
  );
}
