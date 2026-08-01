import { RBAC, Resource, Action } from '@bharatsales/permissions';

describe('RBAC — Super Admin scope', () => {
  it('should NOT blanket-grant Super Admin access to tenant-scoped operational resources', () => {
    expect(RBAC.can('Super Admin', Action.Read, Resource.Orders)).toBe(false);
    expect(RBAC.can('Super Admin', Action.Read, Resource.Analytics)).toBe(false);
    expect(RBAC.can('Super Admin', Action.Read, Resource.Reports)).toBe(false);
    expect(RBAC.can('Super Admin', Action.Read, Resource.Settings)).toBe(false);
    expect(RBAC.can('Super Admin', Action.Read, Resource.Products)).toBe(false);
  });

  it('should still let Super Admin read/update their own notifications', () => {
    expect(RBAC.can('Super Admin', Action.Read, Resource.Notifications)).toBe(true);
    expect(RBAC.can('Super Admin', Action.Update, Resource.Notifications)).toBe(true);
  });

  it('should leave every other role\'s permissions unaffected by the Super Admin scoping change', () => {
    expect(RBAC.can('Organization Admin', Action.Read, Resource.Orders)).toBe(true);
    expect(RBAC.can('Sales Manager', Action.Read, Resource.Analytics)).toBe(true);
    expect(RBAC.can('Sales Representative', Action.Create, Resource.Orders)).toBe(true);
  });
});
