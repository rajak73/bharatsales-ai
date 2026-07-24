import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, MapPin, Target, Store,
  ShoppingCart, CheckSquare, Package, Box, Factory,
  Truck, Percent, Tags, Gift, ArrowDownToLine,
  Bell, Link as LinkIcon, UserCog, Smartphone, CreditCard,
  Sparkles, CalendarClock, Settings, ShieldCheck, Repeat, Receipt, Network,
  BarChart3, ShieldAlert, BookOpen, Server
} from 'lucide-react';

const ALL_ROLES = ['Super Admin', 'Company Admin', 'Area Manager', 'Sales Representative'];
const ADMIN_ROLES = ['Super Admin', 'Company Admin'];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ALL_ROLES },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: Users, label: 'Team', href: '/dashboard/team', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: MapPin, label: 'Live Map', href: '/dashboard/live-map', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: Target, label: 'Beats', href: '/dashboard/beats', roles: ALL_ROLES },
  { icon: Store, label: 'Outlets', href: '/dashboard/outlets', roles: ALL_ROLES },
  { icon: Store, label: 'Outlet 360', href: '/dashboard/outlet-360', roles: ALL_ROLES },
  { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders', roles: ALL_ROLES },
  { icon: CheckSquare, label: 'Approvals', href: '/dashboard/approvals', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: Package, label: 'Products', href: '/dashboard/products', roles: ADMIN_ROLES },
  { icon: Box, label: 'Inventory', href: '/dashboard/inventory', roles: ADMIN_ROLES },
  { icon: Factory, label: 'Warehouses', href: '/dashboard/warehouses', roles: ADMIN_ROLES },
  { icon: Truck, label: 'Dispatches', href: '/dashboard/dispatches', roles: ADMIN_ROLES },
  { icon: Percent, label: 'Tax Rates', href: '/dashboard/tax-rates', roles: ADMIN_ROLES },
  { icon: Tags, label: 'Price Lists', href: '/dashboard/price-lists', roles: ADMIN_ROLES },
  { icon: Gift, label: 'Schemes', href: '/dashboard/schemes', roles: ADMIN_ROLES },
  { icon: Factory, label: 'Distributors', href: '/dashboard/distributors', roles: ALL_ROLES },
  { icon: Receipt, label: 'Collections', href: '/dashboard/collections', roles: ALL_ROLES },
  { icon: Target, label: 'Targets', href: '/dashboard/targets', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: Percent, label: 'Incentives', href: '/dashboard/incentives', roles: ALL_ROLES },
  { icon: Repeat, label: 'Returns', href: '/dashboard/returns', roles: ALL_ROLES },
  { icon: ShieldAlert, label: 'Claims', href: '/dashboard/claims', roles: ALL_ROLES },
  { icon: BookOpen, label: 'Ledger', href: '/dashboard/ledger', roles: ALL_ROLES },
  { icon: Receipt, label: 'Expenses', href: '/dashboard/expenses', roles: ALL_ROLES },
  { icon: LayoutDashboard, label: 'Reports', href: '/dashboard/reports', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: LayoutDashboard, label: 'Exports', href: '/dashboard/exports', roles: ['Super Admin', 'Company Admin', 'Area Manager'] },
  { icon: ArrowDownToLine, label: 'Imports', href: '/dashboard/imports', roles: ADMIN_ROLES },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', roles: ALL_ROLES },
  { icon: LinkIcon, label: 'Integrations', href: '/dashboard/integrations', roles: ADMIN_ROLES },
  { icon: UserCog, label: 'Roles', href: '/dashboard/roles', roles: ADMIN_ROLES },
  { icon: Smartphone, label: 'Devices', href: '/dashboard/devices', roles: ADMIN_ROLES },
  { icon: CreditCard, label: 'Subscription', href: '/dashboard/subscription', roles: ['Super Admin'] },
  { icon: Sparkles, label: 'AI Features', href: '/dashboard/ai-features', roles: ADMIN_ROLES },
  { icon: CalendarClock, label: 'Scheduled Reports', href: '/dashboard/scheduled-reports', roles: ADMIN_ROLES },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ADMIN_ROLES },
  { icon: Network, label: 'Hierarchy', href: '/dashboard/hierarchy', roles: ADMIN_ROLES },
];

export function Sidebar({ open, user }: { open: boolean, user?: { role: string } }) {
  const pathname = usePathname();
  const userRole = user?.role || 'Sales Representative';

  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`${open ? 'w-64' : 'w-20'} bg-white/5 border-r border-white/10 backdrop-blur-xl fixed h-full transition-all duration-300 z-40 overflow-y-auto flex flex-col`}>
      <div className="p-4 border-b border-white/10 flex-shrink-0 sticky top-0 bg-transparent z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          {open && <span className="font-bold text-white tracking-wide truncate">BharatSales</span>}
        </div>
      </div>
      
      <nav className="p-2 space-y-0.5 flex-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] font-medium' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              title={!open ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-300'}`} />
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 bg-transparent space-y-1 flex-shrink-0">
        {userRole === 'Super Admin' && (
          <Link href="/dashboard/superadmin" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm group" title={!open ? 'Super Admin' : undefined}>
            <Server className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-cyan-300 transition-colors" />
            {open && <span className="font-medium truncate">Super Admin</span>}
          </Link>
        )}
        <Link href="/distributor" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm group" title={!open ? 'Distributor' : undefined}>
          <Factory className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-cyan-300 transition-colors" />
          {open && <span className="font-medium truncate">Distributor</span>}
        </Link>
        <Link href="/field-pwa" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm group" title={!open ? 'Field PWA' : undefined}>
          <Smartphone className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-cyan-300 transition-colors" />
          {open && <span className="font-medium truncate">Field PWA</span>}
        </Link>
      </div>
    </aside>
  );
}
