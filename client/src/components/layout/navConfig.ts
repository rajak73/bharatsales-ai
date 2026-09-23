import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, MapPin, Target, Store, ShoppingCart, CheckSquare,
  Package, Box, Factory, Truck, Gift, ArrowDownToLine, UserCog, CreditCard,
  Settings, ShieldCheck, Repeat, Receipt, Network, BarChart3, Server, Trophy,
  Building2, LifeBuoy, IndianRupee, Tag,
} from 'lucide-react';

/**
 * Single source of truth for dashboard navigation AND route access: the
 * Sidebar renders these groups, and `ROUTE_ROLES` (derived below) is what
 * the router's <RequireRole> guard checks, so a link hidden from a role is
 * also unreachable by typing its URL.
 */

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles: readonly string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ALL_ROLES = ['Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative', 'Distributor'];
const ORG_AND_MANAGER = ['Organization Admin', 'Sales Manager'];
const MANAGER_AND_REP = ['Sales Manager', 'Sales Representative'];
const FIELD_EXECUTION = ['Sales Manager', 'Sales Representative', 'Distributor'];
// Organization-scoped company settings (GST, geofence, working days, etc.) —
// Super Admin manages the platform, not a specific org's operational config,
// so this deliberately excludes 'Super Admin'. They have their own
// Platform Settings page instead (see the Platform nav group below).
const ADMIN_ROLES = ['Organization Admin'];

export const navGroups: NavGroup[] = [
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
      { icon: Target, label: 'Beats', href: '/dashboard/beats', roles: ORG_AND_MANAGER },
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

/** Allowed roles per dashboard path, derived from the sidebar config. */
export const ROUTE_ROLES: Record<string, readonly string[]> = Object.fromEntries(
  navGroups.flatMap((group) => group.items.map((item) => [item.href, item.roles] as const)),
);

// Routes reachable from inside other pages rather than the sidebar.
ROUTE_ROLES['/dashboard/notifications'] = ALL_ROLES;
ROUTE_ROLES['/dashboard/reports/dsr'] = ROUTE_ROLES['/dashboard/reports'];

export function rolesForRoute(path: string): readonly string[] {
  const roles = ROUTE_ROLES[path];
  if (!roles) throw new Error(`No role mapping for route ${path} — add it to navConfig.ts`);
  return roles;
}
