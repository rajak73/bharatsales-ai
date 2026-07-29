import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, Users, MapPin, Target, Store,
  ShoppingCart, CheckSquare, Package, Box, Factory,
  Truck, Percent, Tags, Gift, ArrowDownToLine,
  Link as LinkIcon, UserCog, Smartphone, CreditCard,
  Sparkles, CalendarClock, Settings, ShieldCheck, Repeat, Receipt, Network,
  BarChart3, ShieldAlert, BookOpen, Server, ChevronDown, ChevronRight
} from 'lucide-react';

const ALL_ROLES = ['Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative'];
const ADMIN_ROLES = ['Super Admin', 'Organization Admin'];

const navGroups = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ALL_ROLES },
      { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] },
      { icon: MapPin, label: 'Live Map', href: '/dashboard/live-map', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] },
      { icon: LayoutDashboard, label: 'Reports', href: '/dashboard/reports', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] },
      { icon: Users, label: 'Team', href: '/dashboard/team', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] },
      { icon: Repeat, label: 'Outlet 360', href: '/dashboard/outlet-360', roles: ['Super Admin', 'Sales Manager', 'Sales Representative'] },
      { icon: Receipt, label: 'Collections', href: '/dashboard/collections', roles: ['Super Admin', 'Distributor'] },
      { icon: Gift, label: 'Incentives', href: '/dashboard/incentives', roles: ['Super Admin', 'Sales Manager'] },
    ]
  },
  {
    title: 'Sales Operations',
    items: [
      { icon: Target, label: 'Beats', href: '/dashboard/beats', roles: ALL_ROLES },
      { icon: Store, label: 'Outlets', href: '/dashboard/outlets', roles: ALL_ROLES },
      { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders', roles: ALL_ROLES },
      { icon: CheckSquare, label: 'Approvals', href: '/dashboard/approvals', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] },
      { icon: Target, label: 'Targets', href: '/dashboard/targets', roles: ['Super Admin', 'Organization Admin', 'Sales Manager'] }
    ]
  },
  {
    title: 'Inventory & Logistics',
    items: [
      { icon: Box, label: 'Inventory', href: '/dashboard/inventory', roles: ['Super Admin', 'Distributor'] },
      { icon: ArrowDownToLine, label: 'Returns', href: '/dashboard/returns', roles: ['Super Admin', 'Distributor'] },
      { icon: Package, label: 'Products', href: '/dashboard/products', roles: ADMIN_ROLES },
      { icon: Factory, label: 'Distributors', href: '/dashboard/distributors', roles: ALL_ROLES },
    ]
  },
  {
    title: 'Settings & Admin',
    items: [
      { icon: UserCog, label: 'Roles', href: '/dashboard/roles', roles: ['Super Admin'] },
      { icon: Network, label: 'Hierarchy', href: '/dashboard/hierarchy', roles: ADMIN_ROLES },
      { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ADMIN_ROLES },
    ]
  }
];

export function Sidebar({ open, user }: { open: boolean, user?: { role: string } }) {
  const pathname = usePathname();
  const userRole = user?.role || 'Sales Representative';

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
    <aside className={`${open ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 fixed h-full transition-all duration-300 z-40 flex flex-col`}>
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          {open && <span className="font-bold text-gray-900 truncate">BharatSales</span>}
        </div>
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

      <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0 space-y-1">
        {userRole === 'Super Admin' && (
          <Link href="/dashboard/superadmin" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all text-sm group" title={!open ? 'Super Admin' : undefined}>
            <Server className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
            {open && <span className="font-medium truncate">Super Admin</span>}
          </Link>
        )}
        <a href={process.env.NEXT_PUBLIC_FIELD_PWA_URL || 'http://localhost:6001'} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all text-sm group" title={!open ? 'Field PWA' : undefined}>
          <Smartphone className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
          {open && <span className="font-medium truncate">Field PWA</span>}
        </a>
      </div>
    </aside>
  );
}
