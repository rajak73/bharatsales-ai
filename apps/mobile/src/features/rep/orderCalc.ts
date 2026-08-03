import type { Product, Outlet, Distributor, Scheme } from '@bharatsales/shared-types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderCalcResult {
  items: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    appliedSchemeId?: string;
    gstPercentage: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    subTotal: number;
    total: number;
  }[];
  totals: {
    subTotal: number;
    deliveryCharges: number;
    totalBeforeTax: number;
    discountTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
  };
  creditExceeded: boolean;
}

// Ported from apps/field-pwa/src/screens/CartScreen.tsx's calculation engine
// (scheme discount evaluation, inter-state IGST vs intra-state CGST/SGST
// split, outlet credit-limit check) so the same pricing/tax rules apply on
// mobile — the backend re-validates all of this in OrdersService.create()
// regardless, this just gives the rep an accurate preview before submitting.
export function calculateOrder(
  cart: CartItem[],
  outlet: Outlet | undefined,
  distributor: Distributor | undefined,
  schemes: Scheme[]
): OrderCalcResult {
  let subTotal = 0;
  let discountTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  const items: OrderCalcResult['items'] = [];

  const isInterState = !!(distributor && outlet && (distributor as any).location?.state !== (outlet as any).location?.state);
  const deliveryCharges = 0;

  for (const cartItem of cart) {
    const unitPrice = cartItem.product.pricing.basePrice;
    const quantity = cartItem.quantity;
    let discount = 0;
    let appliedSchemeId: string | undefined;

    for (const scheme of schemes) {
      const isApplicable = scheme.applicableProductIds.length === 0 || scheme.applicableProductIds.includes(cartItem.product.id);
      if (isApplicable && quantity >= scheme.minQuantity) {
        if (scheme.type === 'PERCENTAGE_DISCOUNT' && scheme.discountPercentage) {
          discount = unitPrice * quantity * (scheme.discountPercentage / 100);
          appliedSchemeId = scheme.id;
        }
      }
    }

    const itemSubTotal = unitPrice * quantity - discount;
    const gstAmount = itemSubTotal * (cartItem.product.pricing.gstPercentage / 100);

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (isInterState) {
      igstAmount = gstAmount;
    } else {
      cgstAmount = gstAmount / 2;
      sgstAmount = gstAmount / 2;
    }

    subTotal += unitPrice * quantity;
    discountTotal += discount;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;

    items.push({
      productId: cartItem.product.id,
      sku: cartItem.product.sku,
      name: cartItem.product.name,
      quantity,
      unitPrice,
      discount,
      appliedSchemeId,
      gstPercentage: cartItem.product.pricing.gstPercentage,
      cgstAmount,
      sgstAmount,
      igstAmount,
      subTotal: itemSubTotal,
      total: itemSubTotal + cgstAmount + sgstAmount + igstAmount,
    });
  }

  const totalBeforeTax = subTotal + deliveryCharges - discountTotal;
  const grandTotal = totalBeforeTax + cgstTotal + sgstTotal + igstTotal;

  const outstanding = (outlet as any)?.commercial?.outstandingBalance || 0;
  const limit = (outlet as any)?.commercial?.creditLimit || 0;
  const creditExceeded = outlet ? outstanding + grandTotal > limit : false;

  return {
    items,
    totals: { subTotal, deliveryCharges, totalBeforeTax, discountTotal, cgstTotal, sgstTotal, igstTotal, grandTotal },
    creditExceeded,
  };
}
