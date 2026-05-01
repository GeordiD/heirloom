import { Footer } from '#/components/Footer';
import { AddRecipeManuallyModal } from '#/components/recipe/AddRecipeManuallyModal';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { addRecipeByUrl } from '#/server/functions/recipes.functions';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/add')({
  component: AddRecipePage,
});

function AddRecipePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);

  const isValidUrl = (() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl || isLoading) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await addRecipeByUrl({ data: { url } });
      await navigate({ to: '/recipes/$id', params: { id: String(result.id) } });
    } catch (err) {
      console.error('Error adding recipe:', err);
      setError('Failed to add recipe. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <h1 className="text-3xl font-bold">Add Recipe</h1>

        <Card>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <div className="space-y-1">
                <Label htmlFor="recipe-url">Recipe URL</Label>
                <Input
                  id="recipe-url"
                  type="url"
                  value={url}
                  placeholder="https://example.com/recipe"
                  disabled={isLoading}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                />
                {url && !isValidUrl && (
                  <p className="text-sm text-destructive">Please enter a valid URL</p>
                )}
              </div>
              <Button type="submit" disabled={!isValidUrl || isLoading} className="w-full">
                {isLoading ? 'Adding Recipe…' : 'Add Recipe'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 border-t" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => setManualOpen(true)}>
          Add Manually
        </Button>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <h3 className="font-medium mb-2">How to add a recipe:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the URL of a recipe from any cooking website</li>
                <li>Paste it into the URL field above</li>
                <li>Click "Add Recipe" to fetch and save it to your collection</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <AddRecipeManuallyModal open={manualOpen} onClose={() => setManualOpen(false)} />
      </main>
      <Footer />
    </>
  );
}
