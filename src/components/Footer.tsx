import { BookOpen, CalendarDays, PlusCircle, ShoppingCart } from 'lucide-react';

const navIconClass =
  'rounded-full p-4 text-muted-foreground transition hover:bg-accent hover:text-foreground';

export function Footer() {
  return (
    <>
      <nav className="fixed left-4 right-4 bottom-4 z-50 h-14 rounded-full border-2 border-border bg-card px-2 py-2 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 h-full">
          <a href="/meal-plan" aria-label="Meal plan" className={navIconClass}>
            <CalendarDays size={20} />
          </a>
          <a href="/" aria-label="Recipe List" className={navIconClass}>
            <BookOpen size={20} />
          </a>
          <a href="/add-recipe" aria-label="Add recipe" className={navIconClass}>
            <PlusCircle size={20} />
          </a>
          <a href="/lists" aria-label="Shopping list" className={navIconClass}>
            <ShoppingCart size={20} />
          </a>
        </div>
      </nav>
    </>
  );
}
