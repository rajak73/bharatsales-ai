import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { NotificationsService, SettingsService } from '@bharatsales/api-client';
import { useMediaQuery } from '@bharatsales/ui';
import { clearSession, isPlatformAdmin, readCurrentUser } from '../../lib/auth';
import { CurrentUserContext } from '../../contexts/CurrentUserContext';
import { PageLoader } from '../../components/routing/PageLoader';

// Desktop rail preference is a per-browser convenience; storage may be
// unavailable (private mode), so every access is guarded.
const COLLAPSED_KEY = 'bs.sidebarCollapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  // Decoded once per mount; every dashboard page reads it via useCurrentUser().
  const user = useMemo(() => readCurrentUser(), []);
  const isMobile = useMediaQuery('(max-width: 767px)');
  // Mobile: off-canvas drawer, closed by default. Desktop: expanded or icon rail.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [org, setOrg] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // storage unavailable — preference just isn't remembered
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // Super Admin operates at the platform level, not inside a single
    // tenant, so it keeps the platform "BharatSales" brand instead of
    // fetching one organization's branding.
    if (!user || isPlatformAdmin(user)) return;
    let cancelled = false;
    // /settings/branding is readable by every role (GET /settings needs
    // Settings:Read, which Sales Reps and Distributors don't have).
    SettingsService.getBranding()
      .then((settings) => {
        if (!cancelled) setOrg({ name: settings.name, logoUrl: settings.branding?.logoUrl });
      })
      .catch((err) => console.error('Failed to fetch organization branding', err));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Unread count for the header bell. Fetched on load and again when the
  // user enters/leaves the notifications page (where they mark items read) —
  // no polling, to stay light on slow connections. Failures just hide the badge.
  const onNotificationsPage = pathname === '/dashboard/notifications';
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    NotificationsService.getNotifications(user.id ?? '')
      .then((list) => {
        if (!cancelled) setUnreadCount((list || []).filter((n) => !n.read).length);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, onNotificationsPage]);

  if (!user) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return (
    <CurrentUserContext.Provider value={user}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow-overlay focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-background">
        <Sidebar
          user={user}
          org={org}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          isMobile={isMobile}
        />

        <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 motion-reduce:transition-none ${collapsed ? 'md:pl-[4.5rem]' : 'md:pl-60'}`}>
          <Header
            onOpenMobileNav={() => setMobileNavOpen(true)}
            mobileNavOpen={mobileNavOpen}
            unreadCount={unreadCount}
            orgName={org?.name}
          />

          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {/* Standard page container: every dashboard page gets the same max width and compact gutters (16px phone / 20px desktop). */}
            <div className="mx-auto w-full max-w-page px-4 py-4 sm:px-5 sm:py-5">
              {/* Page chunks load inside the layout so Sidebar/Header stay put. */}
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </CurrentUserContext.Provider>
  );
}
