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
} as const;
export type Resource = typeof Resource[keyof typeof Resource];

export type Role = 
  | 'SuperAdmin' 
  | 'CompanyAdmin' 
  | 'SalesManager' 
  | 'SalesRep' 
  | 'DistributorOwner' 
  | 'FinanceUser' 
  | 'AuditorViewer';

const PermissionsByRole: Record<Role, Partial<Record<Resource, Action[]>>> = {
  SuperAdmin: {}, // Super admin has all permissions implicitly
  CompanyAdmin: {
    [Resource.Users]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Products]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Orders]: [Action.Create, Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Distributors]: [Action.Create, Action.Read, Action.Update, Action.Delete, Action.Export],
    [Resource.Settings]: [Action.Create, Action.Read, Action.Update],
    [Resource.Reports]: [Action.Read, Action.Export],
  },
  SalesManager: {
    [Resource.Users]: [Action.Read, Action.Update],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Read, Action.Approve, Action.Export],
    [Resource.Targets]: [Action.Create, Action.Read, Action.Update, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
  },
  SalesRep: {
    [Resource.Attendance]: [Action.Create, Action.Read],
    [Resource.Outlets]: [Action.Create, Action.Read, Action.Update],
    [Resource.Orders]: [Action.Create, Action.Read, Action.Update],
    [Resource.Collections]: [Action.Create, Action.Read],
    [Resource.Targets]: [Action.Read],
  },
  DistributorOwner: {
    [Resource.Inventory]: [Action.Create, Action.Read, Action.Export],
    [Resource.Orders]: [Action.Read, Action.Update, Action.Approve, Action.Export],
    [Resource.Users]: [Action.Create, Action.Read, Action.Update, Action.Delete], // Their staff
  },
  FinanceUser: {
    [Resource.Orders]: [Action.Read, Action.Approve],
    [Resource.Collections]: [Action.Create, Action.Read, Action.Approve, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
  },
  AuditorViewer: {
    [Resource.Users]: [Action.Read, Action.Export],
    [Resource.Products]: [Action.Read, Action.Export],
    [Resource.Outlets]: [Action.Read, Action.Export],
    [Resource.Orders]: [Action.Read, Action.Export],
    [Resource.Distributors]: [Action.Read, Action.Export],
    [Resource.Reports]: [Action.Read, Action.Export],
  },
};

export class RBAC {
  static can(role: Role, action: Action, resource: Resource): boolean {
    if (role === 'SuperAdmin') return true;
    
    const rolePermissions = PermissionsByRole[role];
    if (!rolePermissions) return false;
    
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action);
  }
}
