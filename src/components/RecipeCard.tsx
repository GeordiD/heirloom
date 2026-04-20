import { Badge } from '#/components/ui/badge';
import { Card, CardContent, CardFooter } from '#/components/ui/card';
import type { Recipe } from '#/server/services/recipeService';

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <a href={`/recipes/${recipe.id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <CardContent className="flex flex-col">
          <h2 className="text-xl font-semibold text-foreground">{recipe.name}</h2>
          {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
        </CardContent>
        <CardFooter>
          <span className="text-sm font-medium text-primary">View Recipe →</span>
        </CardFooter>
      </Card>
    </a>
  );
}
