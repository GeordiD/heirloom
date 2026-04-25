import { Link } from '@tanstack/react-router';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-card px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <span className="display-title text-xl font-bold text-foreground">Heirloom</span>
          </Link>

          <div className="flex items-center gap-1">
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
