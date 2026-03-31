import { Card, CardContent, CardFooter } from '#/components/ui/card';
import { Badge } from '#/components/ui/badge';
import type { Recipe } from '#/server/services/recipeService';

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <a href={`/recipes/${recipe.id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <CardContent className="pt-6">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{recipe.name}</h2>
          {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
        </CardContent>
        <CardFooter>
          <span className="text-sm font-medium text-primary">View Recipe →</span>
        </CardFooter>
      </Card>
    </a>
  );
}
