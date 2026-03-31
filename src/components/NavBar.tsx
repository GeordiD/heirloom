import { Link } from '@tanstack/react-router';
import { Plus, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navIconClass =
  'rounded-full p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]';

export default function NavBar() {
  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-[var(--chip-line)] bg-[var(--surface)] px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <span className="display-title text-xl font-bold text-[var(--sea-ink)]">Heirloom</span>
          </Link>

          <div className="flex items-center gap-1">
            <a href="/add-recipe" aria-label="Add recipe" className={navIconClass}>
              <Plus size={20} />
            </a>
            <a href="/meal-plan" aria-label="Meal plan" className={navIconClass}>
              <UtensilsCrossed size={20} />
            </a>
            <a href="/lists" aria-label="Shopping list" className={navIconClass}>
              <ShoppingCart size={20} />
            </a>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <div className="h-14" />
    </>
  );
}
