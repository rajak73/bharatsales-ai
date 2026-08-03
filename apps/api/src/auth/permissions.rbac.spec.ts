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

describe('RBAC — Hierarchy resource (org sales-team structure)', () => {
  it('should let Organization Admin fully manage the hierarchy tree', () => {
    expect(RBAC.can('Organization Admin', Action.Create, Resource.Hierarchy)).toBe(true);
    expect(RBAC.can('Organization Admin', Action.Update, Resource.Hierarchy)).toBe(true);
    expect(RBAC.can('Organization Admin', Action.Delete, Resource.Hierarchy)).toBe(true);
  });

  it('should let Sales Manager only read the hierarchy, never restructure it', () => {
    expect(RBAC.can('Sales Manager', Action.Read, Resource.Hierarchy)).toBe(true);
    expect(RBAC.can('Sales Manager', Action.Create, Resource.Hierarchy)).toBe(false);
    expect(RBAC.can('Sales Manager', Action.Update, Resource.Hierarchy)).toBe(false);
    expect(RBAC.can('Sales Manager', Action.Delete, Resource.Hierarchy)).toBe(false);
  });

  it('should deny Distributor and Sales Representative any hierarchy access — they must not manage the org sales team', () => {
    expect(RBAC.can('Distributor', Action.Read, Resource.Hierarchy)).toBe(false);
    expect(RBAC.can('Distributor', Action.Create, Resource.Hierarchy)).toBe(false);
    expect(RBAC.can('Sales Representative', Action.Read, Resource.Hierarchy)).toBe(false);
  });
});

describe('RBAC — Invoices resource (finance.controller now enforces this, not Orders)', () => {
  it('should let Organization Admin generate and read invoices', () => {
    expect(RBAC.can('Organization Admin', Action.Create, Resource.Invoices)).toBe(true);
    expect(RBAC.can('Organization Admin', Action.Read, Resource.Invoices)).toBe(true);
  });

  it('should let Sales Manager and Distributor only read invoices, never generate them', () => {
    expect(RBAC.can('Sales Manager', Action.Read, Resource.Invoices)).toBe(true);
    expect(RBAC.can('Sales Manager', Action.Create, Resource.Invoices)).toBe(false);
    expect(RBAC.can('Distributor', Action.Read, Resource.Invoices)).toBe(true);
    expect(RBAC.can('Distributor', Action.Create, Resource.Invoices)).toBe(false);
  });

  it('should deny Sales Representative any invoice access', () => {
    expect(RBAC.can('Sales Representative', Action.Read, Resource.Invoices)).toBe(false);
  });
});

describe('RBAC — Schemes/TaxRates/PriceLists (new admin CRUD modules)', () => {
  it('should let Organization Admin fully manage schemes, tax rates, and price lists', () => {
    for (const resource of [Resource.Schemes, Resource.TaxRates, Resource.PriceLists]) {
      expect(RBAC.can('Organization Admin', Action.Create, resource)).toBe(true);
      expect(RBAC.can('Organization Admin', Action.Update, resource)).toBe(true);
      expect(RBAC.can('Organization Admin', Action.Delete, resource)).toBe(true);
    }
  });

  it('should let Sales Manager, Sales Representative, and Distributor only read schemes', () => {
    for (const role of ['Sales Manager', 'Sales Representative', 'Distributor'] as const) {
      expect(RBAC.can(role, Action.Read, Resource.Schemes)).toBe(true);
      expect(RBAC.can(role, Action.Create, Resource.Schemes)).toBe(false);
      expect(RBAC.can(role, Action.Delete, Resource.Schemes)).toBe(false);
    }
  });

  it('should deny Distributor and Sales Representative any write access to tax rates or price lists', () => {
    for (const role of ['Sales Representative', 'Distributor'] as const) {
      expect(RBAC.can(role, Action.Create, Resource.TaxRates)).toBe(false);
      expect(RBAC.can(role, Action.Create, Resource.PriceLists)).toBe(false);
    }
  });
});
