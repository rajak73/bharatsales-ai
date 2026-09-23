import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { IconButton, cn } from '@bharatsales/ui';
import { navGroups } from './navConfig';

interface HeaderProps {
  /** Opens the off-canvas navigation (mobile only). */
  onOpenMobileNav: () => void;
  mobileNavOpen: boolean;
  unreadCount?: number;
  orgName?: string;
}

// Extra titles for routes reached from inside pages rather than the sidebar.
const EXTRA_TITLES: Record<string, { section?: string; label: string }> = {
  '/dashboard/notifications': { label: 'Notifications' },
  '/dashboard/reports/dsr': { section: 'Reports', label: 'Daily Sales Report' },
};

/** Section › Page label for the current route, derived from navConfig. */
function useRouteTitle(): { section?: string; label: string } {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  if (EXTRA_TITLES[path]) return EXTRA_TITLES[path];
  let best: { section?: string; label: string; len: number } | null = null;
  for (const group of navGroups) {
    for (const item of group.items) {
      const match = path === item.href || (item.href !== '/dashboard' && path.startsWith(`${item.href}/`));
      if (match && (!best || item.href.length > best.len)) best = { section: group.title, label: item.label, len: item.href.length };
    }
  }
  return best ?? { label: 'Dashboard' };
}

export function Header({ onOpenMobileNav, mobileNavOpen, unreadCount = 0, orgName }: HeaderProps) {
  const { section, label } = useRouteTitle();
  const countLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  // Sticky bar (the page scrolls under it, the sidebar is fixed); a soft shadow
  // appears once content has scrolled beneath it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b border-border bg-white transition-shadow duration-200 motion-reduce:transition-none',
        scrolled && 'shadow-soft',
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-page items-center gap-2 px-2 sm:px-5">
        {/* Mobile-only: the sidebar is off-canvas below md. Desktop collapses
            it from the toggle inside the sidebar. */}
        <IconButton
          aria-label="Open menu"
          icon={<Menu />}
          onClick={onOpenMobileNav}
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          className="md:hidden"
          noTitle
        />

        <div className="min-w-0 flex-1">
          {/* Where am I: section › page. The page's own <h1> lives in PageHeader. */}
          <p className="flex min-w-0 items-center gap-1.5 text-sm">
            {section && (
              <>
                <span className="hidden truncate text-foreground-subtle sm:inline">{section}</span>
                <span className="hidden text-gray-300 sm:inline" aria-hidden="true">
                  /
                </span>
              </>
            )}
            <span className="truncate font-display font-semibold text-gray-900">{label}</span>
          </p>
          {orgName && <p className="truncate text-xs text-foreground-subtle sm:hidden">{orgName}</p>}
        </div>

        <Link
          to="/dashboard/notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-subtle hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:h-9 sm:w-9"
          aria-label={unreadCount > 0 ? `Notifications, ${countLabel} unread` : 'Notifications'}
          title="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-saffron-500 px-1 text-2xs font-bold leading-none text-navy-900 ring-2 ring-white sm:-right-0.5 sm:-top-0.5',
              )}
              aria-hidden="true"
            >
              {countLabel}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
