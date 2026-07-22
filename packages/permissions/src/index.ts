export const Action = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
  Delete: 'delete',
  Approve: 'approve',
  Export: 'export',
} as const;
export type Action = typeof Action[keyof typeof Action];

export const Resource = {
  Users: 'users',
  Products: 'products',
  Outlets: 'outlets',
  Orders: 'orders',
  Distributors: 'distributors',
  Settings: 'settings',
  Reports: 'reports',
  Attendance: 'attendance',
  Visits: 'visits',
  Collections: 'collections',
  Targets: 'targets',
  Inventory: 'inventory',
  Approvals: 'approvals',
  Beats: 'beats',
  LiveMap: 'live_map',
  Schemes: 'schemes',
  Dispatch: 'dispatch',
  Returns: 'returns',
  Warehouses: 'warehouses',
  Imports: 'imports',
  Subscriptions: 'subscriptions',
  Integrations: 'integrations',
  TaxRates: 'tax_rates',
  PriceLists: 'price_lists',
  Expenses: 'expenses',
  Analytics: 'analytics',
} as const;
export type Resource = typeof Resource[keyof typeof Resource];

export type Role = 
  | 'Super Admin' 
  | 'Company Admin' 
  | 'National Sales Manager' 
  | 'Zonal Sales Manager' 
  | 'Regional Sales Manager' 
  | 'Area Sales Manager' 
  | 'Sales Representative' 
  | 'Distributor Owner' 
  | 'Distributor Staff' 
  | 'Finance User' 
  | 'Auditor';

const PermissionsByRole: Record<Role, Partial<Record<Resource, Action[]>>> = {
  'Super Admin': {}, // Super admin has all permissions implicitly
  'Company Admin': {
    [Resource.Users]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Products]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Orders]: [Action.Create, Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Distributors]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Settings]: [Action.Create, Action.Read, Action.Update],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Create, Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Beats]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.LiveMap]: [Action.Read],
    [Resource.Schemes]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.Dispatch]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.Returns]: [Action.Create, Action.Read, Action.Update, Action.Approve],
    [Resource.Warehouses]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.Imports]: [Action.Create, Action.Read],
    [Resource.Subscriptions]: [Action.Read, Action.Update],
    [Resource.Integrations]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.TaxRates]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.PriceLists]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.Expenses]: [Action.Create, Action.Read, Action.Update, Action.Approve],
    [Resource.Attendance]: [Action.Read, Action.Update, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Update, Action.Export],
    [Resource.Collections]: [Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Delete],
    [Resource.Inventory]: [Action.Read, Action.Update, Action.Export],
  },
  'National Sales Manager': {
    [Resource.Users]: [Action.Read, Action.Update],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Read, Action.Approve],
    [Resource.Beats]: [Action.Create, Action.Read, Action.Update],
    [Resource.LiveMap]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.Attendance]: [Action.Read, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Export],
    [Resource.Collections]: [Action.Read],
    [Resource.Expenses]: [Action.Read, Action.Approve],
    [Resource.PriceLists]: [Action.Read],
    [Resource.TaxRates]: [Action.Read],
  },
  'Zonal Sales Manager': {
    [Resource.Users]: [Action.Read, Action.Update],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Read, Action.Approve],
    [Resource.Beats]: [Action.Create, Action.Read, Action.Update],
    [Resource.LiveMap]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.Attendance]: [Action.Read, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Export],
    [Resource.Collections]: [Action.Read],
    [Resource.Expenses]: [Action.Read, Action.Approve],
    [Resource.PriceLists]: [Action.Read],
    [Resource.TaxRates]: [Action.Read],
  },
  'Regional Sales Manager': {
    [Resource.Users]: [Action.Read, Action.Update],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Read, Action.Approve],
    [Resource.Beats]: [Action.Create, Action.Read, Action.Update],
    [Resource.LiveMap]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.Attendance]: [Action.Read, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Export],
    [Resource.Collections]: [Action.Read],
    [Resource.Expenses]: [Action.Read, Action.Approve],
    [Resource.PriceLists]: [Action.Read],
    [Resource.TaxRates]: [Action.Read],
  },
  'Area Sales Manager': {
    [Resource.Users]: [Action.Read, Action.Update],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Read, Action.Approve],
    [Resource.Beats]: [Action.Create, Action.Read, Action.Update],
    [Resource.LiveMap]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.Attendance]: [Action.Read, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Export],
    [Resource.Collections]: [Action.Read],
    [Resource.Expenses]: [Action.Read, Action.Approve],
    [Resource.PriceLists]: [Action.Read],
    [Resource.TaxRates]: [Action.Read],
  },
  'Sales Representative': {
    [Resource.Attendance]: [Action.Create, Action.Read],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Create, Action.Read, Action.Update],
    [Resource.Collections]: [Action.Create, Action.Read],
    [Resource.Targets]: [Action.Read],
    [Resource.Visits]: [Action.Create, Action.Read, Action.Update],
    [Resource.Beats]: [Action.Read],
    [Resource.Approvals]: [Action.Create, Action.Read],
    [Resource.Expenses]: [Action.Create, Action.Read],
    [Resource.Returns]: [Action.Create, Action.Read],
    [Resource.Products]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.PriceLists]: [Action.Read],
    [Resource.TaxRates]: [Action.Read],
  },
  'Distributor Owner': {
    [Resource.Inventory]: [Action.Create, Action.Read, Action.Export],
    [Resource.Orders]: [Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Users]: [Action.Create, Action.Read, Action.Update, Action.Delete], // Their staff
    [Resource.Dispatch]: [Action.Create, Action.Read, Action.Update],
    [Resource.Returns]: [Action.Read, Action.Update, Action.Approve],
    [Resource.Products]: [Action.Read],
    [Resource.Schemes]: [Action.Read],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read],
  },
  'Distributor Staff': {
    [Resource.Inventory]: [Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Update],
    [Resource.Dispatch]: [Action.Read, Action.Update],
    [Resource.Returns]: [Action.Read, Action.Update],
  },
  'Finance User': {
    [Resource.Orders]: [Action.Read, Action.Approve],
    [Resource.Collections]: [Action.Create, Action.Read, Action.Approve, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.TaxRates]: [Action.Create, Action.Read, Action.Update],
    [Resource.PriceLists]: [Action.Create, Action.Read, Action.Update],
    [Resource.Expenses]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Subscriptions]: [Action.Read, Action.Update],
    [Resource.Approvals]: [Action.Read, Action.Approve],
  },
  'Auditor': {
    [Resource.Users]: [Action.Read, Action.Export],
    [Resource.Products]: [Action.Read, Action.Export],
    [Resource.Outlets]: [Action.Read, Action.Export],
    [Resource.Orders]: [Action.Read, Action.Export],
    [Resource.Distributors]: [Action.Read, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
    [Resource.Analytics]: [Action.Read, Action.Export],
    [Resource.Attendance]: [Action.Read, Action.Export],
    [Resource.Visits]: [Action.Read, Action.Export],
    [Resource.Collections]: [Action.Read, Action.Export],
    [Resource.Targets]: [Action.Read, Action.Export],
    [Resource.Inventory]: [Action.Read, Action.Export],
    [Resource.Approvals]: [Action.Read, Action.Export],
    [Resource.Beats]: [Action.Read, Action.Export],
    [Resource.Schemes]: [Action.Read, Action.Export],
    [Resource.Dispatch]: [Action.Read, Action.Export],
    [Resource.Returns]: [Action.Read, Action.Export],
    [Resource.Warehouses]: [Action.Read, Action.Export],
    [Resource.TaxRates]: [Action.Read, Action.Export],
    [Resource.PriceLists]: [Action.Read, Action.Export],
    [Resource.Expenses]: [Action.Read, Action.Export],
  },
};

export class RBAC {
  static can(role: Role, action: Action, resource: Resource): boolean {
    if (role === 'Super Admin') return true;
    
    const rolePermissions = PermissionsByRole[role];
    if (!rolePermissions) return false;
    
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action);
  }
}
