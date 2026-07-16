export interface PriceList {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  outlets: string;
  products: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: string;
}

export interface PriceListItem {
  sku: string;
  name: string;
  mrp: number;
  standard: number;
  wholesale: number;
  tierA: number;
  minPrice: number;
}
