import { calculateOrder } from './orderCalc';
import type { Product, Outlet, Distributor, Scheme } from '@bharatsales/shared-types';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1', organizationId: 'org1', name: 'Test Product', sku: 'SKU-1', category: 'General', brand: 'Brand',
    pricing: { basePrice: 100, mrp: 120, ptr: 90, gstPercentage: 18, tierPricing: {} },
    status: 'Active', createdAt: '', updatedAt: '',
    ...overrides,
  } as Product;
}

function outlet(state: string, creditLimit = 100000, outstandingBalance = 0): Outlet {
  return { id: 'o1', location: { state } as any, commercial: { creditLimit, outstandingBalance } } as any;
}

function distributor(state: string): Distributor {
  return { id: 'd1', location: { state } as any } as any;
}

describe('calculateOrder', () => {
  it('splits GST into CGST+SGST for an intra-state order', () => {
    const result = calculateOrder(
      [{ product: product(), quantity: 1 }],
      outlet('Maharashtra'),
      distributor('Maharashtra'),
      []
    );
    expect(result.totals.cgstTotal).toBeCloseTo(9);
    expect(result.totals.sgstTotal).toBeCloseTo(9);
    expect(result.totals.igstTotal).toBe(0);
    expect(result.totals.grandTotal).toBeCloseTo(118);
  });

  it('charges IGST instead of CGST+SGST for an inter-state order', () => {
    const result = calculateOrder(
      [{ product: product(), quantity: 1 }],
      outlet('Maharashtra'),
      distributor('Karnataka'),
      []
    );
    expect(result.totals.igstTotal).toBeCloseTo(18);
    expect(result.totals.cgstTotal).toBe(0);
    expect(result.totals.sgstTotal).toBe(0);
  });

  it('applies a percentage-discount scheme once the minimum quantity is met', () => {
    const scheme: Scheme = {
      id: 's1', organizationId: 'org1', name: 'Bulk discount', description: '', type: 'PERCENTAGE_DISCOUNT',
      isActive: true, applicableProductIds: [], minQuantity: 10, minOrderValue: 0, discountPercentage: 10,
      validFrom: '', validUntil: '', createdAt: '', updatedAt: '',
    };
    const result = calculateOrder(
      [{ product: product(), quantity: 10 }],
      outlet('Maharashtra'),
      distributor('Maharashtra'),
      [scheme]
    );
    // 10 units * 100 = 1000 subtotal, 10% off = 100 discount
    expect(result.totals.discountTotal).toBeCloseTo(100);
    expect(result.items[0].appliedSchemeId).toBe('s1');
  });

  it('does not apply a scheme below its minimum quantity threshold', () => {
    const scheme: Scheme = {
      id: 's1', organizationId: 'org1', name: 'Bulk discount', description: '', type: 'PERCENTAGE_DISCOUNT',
      isActive: true, applicableProductIds: [], minQuantity: 10, minOrderValue: 0, discountPercentage: 10,
      validFrom: '', validUntil: '', createdAt: '', updatedAt: '',
    };
    const result = calculateOrder(
      [{ product: product(), quantity: 5 }],
      outlet('Maharashtra'),
      distributor('Maharashtra'),
      [scheme]
    );
    expect(result.totals.discountTotal).toBe(0);
    expect(result.items[0].appliedSchemeId).toBeUndefined();
  });

  it('flags creditExceeded when outstanding + grand total exceeds the outlet credit limit', () => {
    const result = calculateOrder(
      [{ product: product(), quantity: 1 }],
      outlet('Maharashtra', 100, 0),
      distributor('Maharashtra'),
      []
    );
    // grandTotal is 118, limit is 100 -> exceeded
    expect(result.creditExceeded).toBe(true);
  });

  it('does not flag creditExceeded when well within the credit limit', () => {
    const result = calculateOrder(
      [{ product: product(), quantity: 1 }],
      outlet('Maharashtra', 100000, 0),
      distributor('Maharashtra'),
      []
    );
    expect(result.creditExceeded).toBe(false);
  });
});
