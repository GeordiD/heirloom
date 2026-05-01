import { useLocation } from '@tanstack/react-router';
import { BookOpen, CalendarDays, PlusCircle, ShoppingCart } from 'lucide-react';

export function Footer() {
  return (
    <>
      <nav className="fixed left-4 right-4 bottom-4 z-50 h-14">
        <div className="flex items-center justify-between gap-2 h-full py-2 rounded-full border-2 border-border bg-card max-w-120 mx-auto">
          <Option icon={<CalendarDays size={20} />} url="/" label="Meal Plan" />
          <Option icon={<BookOpen size={20} />} url="/recipes" label="Recipe List" />
          <Option icon={<PlusCircle size={20} />} url="/add" label="Add Recipe" />
          <Option icon={<ShoppingCart size={20} />} url="/list" label="Shopping List" />
        </div>
      </nav>
    </>
  );
}

function Option({ icon, url, label }: { icon: React.ReactElement; url: string; label: string }) {
  const location = useLocation();
  const isActive = location.pathname == url;

  const defaultClasses = 'rounded-full p-4 transition hover:bg-accent hover:text-foreground';
  const activeClasses = isActive ? 'bg-primary text-foreground' : '';

  return (
    <a href={url} aria-label={label} className={[defaultClasses, activeClasses].join(' ')}>
      {icon}
    </a>
  );
}
