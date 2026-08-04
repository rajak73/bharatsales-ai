import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, MapPin, Target, Store,
  ShoppingCart, CheckSquare, Package, Box, Factory,
  Truck, Percent, Tags, Gift, ArrowDownToLine,
  Link as LinkIcon, UserCog, Smartphone, CreditCard,
  Sparkles, CalendarClock, Settings, ShieldCheck, Repeat, Receipt, Network,
  BarChart3, ShieldAlert, BookOpen, Server, ChevronDown, ChevronRight, Trophy,
  Building2, LifeBuoy, IndianRupee, Tag, LogOut, Menu
} from 'lucide-react';
import { AuthService } from '@bharatsales/api-client';

const ALL_ROLES = ['Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative', 'Distributor'];
const ORG_AND_MANAGER = ['Organization Admin', 'Sales Manager'];
const MANAGER_AND_REP = ['Sales Manager', 'Sales Representative'];
const FIELD_EXECUTION = ['Sales Manager', 'Sales Representative', 'Distributor'];
// Organization-scoped company settings (GST, geofence, working days, etc.) —
// Super Admin manages the platform, not a specific org's operational config,
// so this deliberately excludes 'Super Admin'. They have their own
// Platform Settings page instead (see the Platform nav group below).
const ADMIN_ROLES = ['Organization Admin'];

const navGroups = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ALL_ROLES },
      { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['Organization Admin', 'Sales Manager'] },
      { icon: MapPin, label: 'Live Map', href: '/dashboard/live-map', roles: ['Sales Manager'] },
      { icon: LayoutDashboard, label: 'Reports', href: '/dashboard/reports', roles: ['Organization Admin', 'Sales Manager', 'Distributor'] },
      { icon: Users, label: 'Team', href: '/dashboard/team', roles: ORG_AND_MANAGER },
      { icon: Trophy, label: 'Performance', href: '/dashboard/performance', roles: ['Sales Manager'] },
      { icon: Repeat, label: 'Outlet 360', href: '/dashboard/outlet-360', roles: MANAGER_AND_REP },
      { icon: Receipt, label: 'Payments', href: '/dashboard/collections', roles: ['Distributor'] },
      { icon: Gift, label: 'Incentives', href: '/dashboard/incentives', roles: ORG_AND_MANAGER },
    ]
  },
  {
    title: 'Sales Operations',
    items: [
      { icon: Target, label: 'Beats', href: '/dashboard/beats', roles: ['Sales Manager'] },
      { icon: ShoppingCart, label: 'Sales', href: '/dashboard/sales', roles: ['Organization Admin'] },
      { icon: Store, label: 'Outlets', href: '/dashboard/outlets', roles: [...FIELD_EXECUTION, 'Organization Admin'] },
      { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders', roles: FIELD_EXECUTION },
      { icon: Truck, label: 'Deliveries', href: '/dashboard/deliveries', roles: ['Distributor'] },
      { icon: CheckSquare, label: 'Approvals', href: '/dashboard/approvals', roles: ORG_AND_MANAGER },
      { icon: Target, label: 'Targets', href: '/dashboard/targets', roles: ORG_AND_MANAGER }
    ]
  },
  {
    title: 'Inventory & Logistics',
    items: [
      { icon: Box, label: 'Inventory', href: '/dashboard/inventory', roles: ['Distributor'] },
      { icon: ArrowDownToLine, label: 'Returns', href: '/dashboard/returns', roles: ['Distributor'] },
      { icon: Package, label: 'Products', href: '/dashboard/products', roles: ['Organization Admin'] },
      { icon: Tag, label: 'Pricing & Schemes', href: '/dashboard/pricing', roles: ['Organization Admin'] },
      { icon: Factory, label: 'Distributors', href: '/dashboard/distributors', roles: ORG_AND_MANAGER },
    ]
  },
  {
    title: 'Settings & Admin',
    items: [
      { icon: UserCog, label: 'Roles', href: '/dashboard/roles', roles: ['Super Admin'] },
      { icon: Network, label: 'Hierarchy', href: '/dashboard/hierarchy', roles: ['Organization Admin'] },
      { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ADMIN_ROLES },
    ]
  },
  {
    title: 'Platform',
    items: [
      { icon: Server, label: 'Platform Dashboard', href: '/dashboard/superadmin', roles: ['Super Admin'] },
      { icon: Building2, label: 'Organizations', href: '/dashboard/superadmin/organizations', roles: ['Super Admin'] },
      { icon: CreditCard, label: 'Subscriptions', href: '/dashboard/superadmin/subscriptions', roles: ['Super Admin'] },
      { icon: IndianRupee, label: 'Billing', href: '/dashboard/superadmin/billing', roles: ['Super Admin'] },
      { icon: BarChart3, label: 'Platform Analytics', href: '/dashboard/superadmin/analytics', roles: ['Super Admin'] },
      { icon: Users, label: 'Global Users', href: '/dashboard/superadmin/users', roles: ['Super Admin'] },
      { icon: LifeBuoy, label: 'Support', href: '/dashboard/superadmin/support', roles: ['Super Admin'] },
      { icon: ShieldCheck, label: 'Audit Logs', href: '/dashboard/superadmin/audit', roles: ['Super Admin'] },
      { icon: Settings, label: 'Platform Settings', href: '/dashboard/superadmin/settings', roles: ['Super Admin'] },
    ]
  }
];

interface SidebarProps {
  open: boolean;
  user?: { name: string; role: string };
  org?: { name: string; logoUrl?: string } | null;
  onClose?: () => void;
  onToggle?: () => void;
}

export function Sidebar({ open, user, org, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const userRole = user?.role || 'Sales Representative';
  const userName = user?.name || 'User';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const brandName = org?.name || 'BharatSales';
  const brandInitials = brandName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'BS';

  const handleLogout = () => {
    AuthService.logout();
  };

  // On mobile the sidebar is an off-canvas drawer, so tapping a nav link
  // should close it; on desktop `open` instead means "expanded vs icon
  // rail" and must stay untouched by navigation.
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      onClose?.();
    }
  };

  // Open groups that contain the currently active link
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navGroups.forEach(group => {
      initialState[group.title] = true;
    });
    return initialState;
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      {/* Mobile-only backdrop — the sidebar overlays content on small
          screens instead of pushing it, so tapping outside should close it. */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => onClose?.()}
        />
      )}
      <aside
        className={`${open ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'} bg-white border-r border-gray-200 fixed inset-y-0 left-0 transition-all duration-300 z-40 flex flex-col`}
      >
      <div className={`p-4 border-b border-gray-100 flex-shrink-0 bg-white flex items-center ${open ? 'justify-between' : 'flex-col gap-2'}`}>
        <div className="flex items-center space-x-2 min-w-0">
          {org?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{brandInitials}</span>
            </div>
          )}
          {open && <span className="font-bold text-gray-900 truncate">{brandName}</span>}
        </div>
        {/* Desktop-only collapse/expand toggle, kept inside the sidebar
            itself rather than the header — mobile keeps its own hamburger
            in the header since this sidebar is off-canvas there. */}
        <button
          onClick={onToggle}
          className="hidden md:flex p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors flex-shrink-0"
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
      
      <nav className="p-3 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole));
          
          if (visibleItems.length === 0) return null;

          const isGroupOpen = openGroups[group.title] || !open;

          return (
            <div key={group.title} className="space-y-1">
              {open && (
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1 mb-1 group"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    {group.title}
                  </span>
                  {isGroupOpen ? (
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>
              )}
              
              {isGroupOpen && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group text-sm ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        title={!open ? item.label : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        {open && <span className="truncate">{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {MANAGER_AND_REP.includes(userRole) && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0 space-y-1">
          <a href={process.env.NEXT_PUBLIC_FIELD_PWA_URL || 'http://localhost:6001'} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all text-sm group" title={!open ? 'Field PWA' : undefined}>
            <Smartphone className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
            {open && <span className="font-medium truncate">Field PWA</span>}
          </a>
        </div>
      )}

      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <div className={`flex items-center ${open ? 'space-x-3' : 'justify-center'}`}>
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0" title={!open ? userName : undefined}>
            <span className="text-primary-700 font-medium text-sm">{userInitials}</span>
          </div>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
                <div className="text-xs text-gray-500 truncate">{userRole}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}
