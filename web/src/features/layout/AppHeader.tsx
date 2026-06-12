// Top app bar: product branding (links home) on the left, pill navigation
// with icon + text labels in the center, and the account avatar menu on the right.
// Active state is computed manually (plain string className) because NavLink's
// function className is not compatible with asChild patterns.
import { Link, useLocation } from 'react-router-dom';
import { FileText, NotebookPen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import type { AuthUser } from '@/types';
import { AvatarMenu } from './AvatarMenu';

const NAV_ITEMS = [
  { to: ROUTES.notes, label: 'Notes', icon: FileText, end: false },
  { to: ROUTES.patients, label: 'Patients', icon: Users, end: false },
];

interface AppHeaderProps {
  user: AuthUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="relative flex h-16 w-full items-center justify-between px-6">
        <Link
          to={ROUTES.notes}
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <NotebookPen size={16} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-[15px] font-bold tracking-wide">Scribble</span>
        </Link>

        <nav
          className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border border-border bg-muted p-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
            const isActive = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <AvatarMenu user={user} />
      </div>
    </header>
  );
}
