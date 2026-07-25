import { Link } from '@tanstack/react-router';
import HeirloomLogo from './images/HeirloomLogo';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-border bg-card px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="text-foreground transition-opacity hover:opacity-80">
            <HeirloomLogo className="h-6" />
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
