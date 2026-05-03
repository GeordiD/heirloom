import { Link, useLocation } from '@tanstack/react-router';
import { BookOpen, CalendarDays, Plus, ShoppingCart } from 'lucide-react';
import React from 'react';

type FooterOptionProps = { icon: React.ReactElement; url: string; label: string };

const options: FooterOptionProps[] = [
  {
    icon: <CalendarDays size={20} />,
    url: '/',
    label: 'Meal Plan',
  },
  {
    icon: <BookOpen size={20} />,
    url: '/recipes',
    label: 'Recipe List',
  },
  {
    icon: <ShoppingCart size={20} />,
    url: '/list',
    label: 'Shopping List',
  },
];

export function Footer() {
  return (
    <>
      <nav className="fixed left-6 right-6 bottom-6 z-50 h-14">
        <div className="max-w-120 mx-auto h-full flex gap-3">
          <BigFooter />
          <FloatingContainer>
            <FooterOption icon={<Plus size={20} />} url="/add" label="Add Recipe" />
          </FloatingContainer>
        </div>
      </nav>
    </>
  );
}

function FloatingContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-between gap-2 h-full px-1 py-2 rounded-full border-2 border-border bg-card ${className}`}
    >
      {children}
    </div>
  );
}

function BigFooter() {
  const location = useLocation();
  const activeIndex = options.findIndex((o) => o.url === location.pathname);

  const showPill = activeIndex >= 0 && activeIndex <= 2;

  return (
    <FloatingContainer className="grow">
      {options.map((props) => (
        <FooterOption key={props.url} {...props} />
      ))}
      {showPill && (
        <span
          className="absolute rounded-full h-11 w-[calc((100%-1.5rem)/3)] bg-secondary bottom-1 transition-[left,opacity] duration-200 ease-out"
          style={{
            left: `calc(0.25rem + ${activeIndex} * ((100% - 1.5rem) / 3 + 0.5rem))`,
            opacity: showPill ? 1 : 0,
          }}
        />
      )}
    </FloatingContainer>
  );
}

function FooterOption({ icon, url, label }: FooterOptionProps) {
  const location = useLocation();
  const isActive = location.pathname == url;

  const defaultClasses = 'rounded-full p-3 transition grow flex justify-center z-10';
  const activeClasses = isActive ? 'text-red-700' : '';

  return (
    <Link to={url} aria-label={label} className={[defaultClasses, activeClasses].join(' ')}>
      {icon}
    </Link>
  );
}
