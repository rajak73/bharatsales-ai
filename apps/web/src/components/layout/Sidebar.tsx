import { Link, useLocation } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Smartphone, X } from 'lucide-react';
import { AuthService } from '@bharatsales/api-client';
import { Avatar, DropdownMenu, IconButton, Tooltip, cn, useEscapeKey, useFocusTrap, useLockBodyScroll, type DropdownItem } from '@bharatsales/ui';

import { navGroups, ROUTE_ROLES } from './navConfig';
import { hasRouteAccess, ROLES, type CurrentUser } from '../../lib/auth';

interface SidebarProps {
  user: CurrentUser;
  org?: { name: string; logoUrl?: string } | null;
  /** Desktop (≥md): icon-only rail when true. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile (<md): off-canvas drawer visibility. */
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** True below md — the sidebar behaves as a modal drawer. */
  isMobile: boolean;
}

export function Sidebar({ user, org, collapsed, onToggleCollapsed, mobileOpen, onMobileClose, isMobile }: SidebarProps) {
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLElement>(null);
  const userRole = user.role || ROLES.SALES_REP;
  const userName = user.name || 'User';
  const brandName = org?.name || 'BharatSales';

  // In the mobile drawer the sidebar is always shown expanded.
  const rail = collapsed && !isMobile;
  const drawerActive = isMobile && mobileOpen;
  useFocusTrap(panelRef, drawerActive);
  useLockBodyScroll(drawerActive);
  useEscapeKey(onMobileClose, drawerActive);

  // Role filtering is unchanged: an item shows only if the user may open its route.
  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => hasRouteAccess(user, item.roles)) }))
        .filter((group) => group.items.length > 0),
    [user],
  );

  // Active = the longest nav href that prefixes the current path, so
  // /dashboard/reports/dsr highlights "Reports" and /dashboard only matches exactly.
  const activeHref = useMemo(() => {
    let best = '';
    for (const group of visibleGroups) {
      for (const item of group.items) {
        const match = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
        if (match && item.href.length > best.length) best = item.href;
      }
    }
    return best;
  }, [pathname, visibleGroups]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.title, true])),
  );
  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleNavClick = () => {
    if (isMobile) onMobileClose();
  };

  const handleLogout = () => {
    AuthService.logout();
  };

  const canOpenSettings = hasRouteAccess(user, ROUTE_ROLES['/dashboard/settings'] ?? []);
  const menuItems: DropdownItem[] = [
    { label: 'Notifications', icon: <Bell />, href: '/dashboard/notifications', onSelect: handleNavClick },
    ...(canOpenSettings ? [{ label: 'Company settings', icon: <Settings />, href: '/dashboard/settings', onSelect: handleNavClick }] : []),
    { type: 'separator' },
    { label: 'Log out', icon: <LogOut />, onSelect: handleLogout, danger: true },
  ];

  return (
    <>
      {/* Mobile backdrop: the drawer overlays content; tapping outside closes it. */}
      <div
        className={cn(
          'fixed inset-0 z-sidebar bg-gray-900/50 transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
        onClick={onMobileClose}
      />
      <aside
        ref={panelRef}
        id="app-sidebar"
        aria-label="Main navigation"
        role={drawerActive ? 'dialog' : undefined}
        aria-modal={drawerActive || undefined}
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 left-0 z-sidebar flex flex-col bg-navy-900 text-navy-200 outline-none',
          'transition-[transform,width,visibility] duration-200 ease-out motion-reduce:transition-none',
          // mobile: off-canvas drawer (invisible when closed so it leaves the tab order)
          'w-[18rem] max-w-[85vw]',
          mobileOpen ? 'translate-x-0 shadow-overlay' : 'invisible -translate-x-full',
          // desktop: always visible, full width or icon rail
          'md:visible md:max-w-none md:translate-x-0 md:shadow-none',
          rail ? 'md:w-[4.5rem]' : 'md:w-60',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3', rail && 'md:justify-center md:px-0')}>
          <Link
            to="/dashboard"
            onClick={handleNavClick}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 md:flex-none"
            aria-label={`${brandName} — dashboard home`}
          >
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-md bg-white object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-saffron-500 font-display text-[0.8125rem] font-extrabold text-navy-900" aria-hidden="true">
                BS
              </span>
            )}
            {!rail && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-display text-sm font-bold text-white">{brandName}</span>
                <span className="block truncate text-2xs font-medium uppercase tracking-wider text-navy-300">
                  {org ? 'BharatSales AI' : 'Sales & distribution'}
                </span>
              </span>
            )}
          </Link>
          {!rail && (
            <IconButton
              aria-label="Collapse sidebar"
              icon={<PanelLeftClose />}
              size="sm"
              onClick={onToggleCollapsed}
              className="ml-auto hidden text-navy-300 hover:bg-navy-800 hover:text-white md:inline-flex"
            />
          )}
          <IconButton aria-label="Close menu" icon={<X />} onClick={onMobileClose} className="ml-auto text-navy-200 hover:bg-navy-800 hover:text-white md:hidden" />
        </div>

        {rail && (
          <div className="hidden justify-center border-b border-white/10 py-2 md:flex">
            <IconButton
              aria-label="Expand sidebar"
              icon={<PanelLeftOpen />}
              size="sm"
              onClick={onToggleCollapsed}
              className="text-navy-300 hover:bg-navy-800 hover:text-white"
            />
          </div>
        )}

        {/* Navigation */}
        <nav className={cn('custom-scrollbar-dark flex-1 overflow-y-auto py-2', rail ? 'px-2' : 'px-2.5')} aria-label="Primary">
          {visibleGroups.map((group, gi) => {
            const isGroupOpen = rail || openGroups[group.title] !== false;
            const groupId = `nav-group-${gi}`;
            return (
              <div key={group.title} className={cn(gi > 0 && (rail ? 'mt-2 border-t border-white/10 pt-2' : 'mt-3'))}>
                {!rail && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    aria-expanded={isGroupOpen}
                    aria-controls={groupId}
                    className="group flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
                  >
                    <span className="text-2xs font-semibold uppercase tracking-wider text-navy-300 group-hover:text-navy-100">{group.title}</span>
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 text-navy-400 transition-transform group-hover:text-navy-200', !isGroupOpen && '-rotate-90')}
                      aria-hidden="true"
                    />
                  </button>
                )}
                {isGroupOpen && (
                  <ul id={groupId} className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.href === activeHref;
                      const link = (
                        <Link
                          to={item.href}
                          onClick={handleNavClick}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={rail ? item.label : undefined}
                          className={cn(
                            'group relative flex min-h-[44px] items-center gap-2.5 rounded-md text-sm font-medium transition-colors md:min-h-[34px]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400',
                            rail ? 'w-full justify-center px-0' : 'px-2.5',
                            isActive ? 'bg-navy-800 text-white' : 'text-navy-200 hover:bg-navy-800/70 hover:text-white',
                          )}
                        >
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-saffron-500" aria-hidden="true" />}
                          <Icon
                            className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-navy-300 group-hover:text-white')}
                            aria-hidden="true"
                          />
                          {!rail && <span className="truncate">{item.label}</span>}
                        </Link>
                      );
                      return (
                        <li key={item.href}>
                          {rail ? (
                            <Tooltip content={item.label} side="right" delay={100} wrapperClassName="flex w-full">
                              {link}
                            </Tooltip>
                          ) : (
                            link
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* field-pwa itself only ever accepts a 'Sales Representative' login
            (see apps/field-pwa's AuthContext ALLOWED_ROLE) — showing this to
            Sales Managers just sends them to a guaranteed login error. */}
        {userRole === 'Sales Representative' && (
          <div className={cn('shrink-0 border-t border-white/10 py-2', rail ? 'px-2' : 'px-2.5')}>
            <a
              href={import.meta.env.VITE_FIELD_PWA_URL || 'http://localhost:6001'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={rail ? 'Open Field PWA (opens in new tab)' : undefined}
              title={rail ? 'Field PWA' : undefined}
              className={cn(
                'group flex min-h-[44px] items-center gap-2.5 rounded-md text-sm font-medium text-navy-200 transition-colors hover:bg-navy-800/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 md:min-h-[34px]',
                rail ? 'justify-center' : 'px-2.5',
              )}
            >
              <Smartphone className="h-[18px] w-[18px] shrink-0 text-navy-300 group-hover:text-white" aria-hidden="true" />
              {!rail && (
                <span className="truncate">
                  Field PWA <span className="sr-only">(opens in new tab)</span>
                </span>
              )}
            </a>
          </div>
        )}

        {/* User menu */}
        <div className={cn('shrink-0 border-t border-white/10 p-2', !rail && 'px-2.5')}>
          <DropdownMenu
            side="top"
            align="start"
            className="w-full"
            widthClassName={rail ? 'w-60' : 'w-full'}
            header={
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                {user.email && <p className="truncate text-xs text-foreground-subtle">{user.email}</p>}
                <p className="mt-1 truncate text-xs font-medium text-primary-700">{userRole}</p>
              </div>
            }
            items={menuItems}
            trigger={(props) => (
              <button
                {...props}
                type="button"
                aria-label={`Account menu for ${userName}`}
                className={cn(
                  'flex w-full min-h-[44px] items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400',
                  rail && 'justify-center',
                )}
              >
                <Avatar name={userName} size="sm" />
                {!rail && (
                  <>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-medium text-white">{userName}</span>
                      <span className="block truncate text-xs text-navy-300">{userRole}</span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-navy-300" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          />
        </div>
      </aside>
    </>
  );
}
