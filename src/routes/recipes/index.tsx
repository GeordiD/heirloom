import RecipeCard from '#/components/RecipeCard';
import { Input } from '#/components/ui/input';
import { useShowFooter } from '#/contexts/FooterContext';
import { fetchRecipes } from '#/server/functions/recipes.functions';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useState } from 'react';

const recipesQueryOptions = {
  queryKey: ['recipes'] as const,
  queryFn: fetchRecipes,
};

export const Route = createFileRoute('/recipes/')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(recipesQueryOptions),
  component: RecipesPage,
});

function RecipesPage() {
  useShowFooter(true);
  const { data: recipes = [] } = useQuery(recipesQueryOptions);
  const [search, setSearch] = useState('');

  const filtered = recipes.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <main className="mx-auto max-w-4xl px-6 py-4 flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Recipes</h1>
          <div className="relative max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {recipes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No recipes yet.</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No recipes match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
