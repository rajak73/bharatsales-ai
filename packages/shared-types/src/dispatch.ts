export interface Dispatch {
  id: string;
  organizationId: string;
  orderId: string;
  vehicle: string;
  driver: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Partial_Delivery' | 'Damaged_Delivery' | 'Short_Delivery' | 'Refused' | 'Return_Initiated' | 'Cancelled';
  deliveredItems?: { 
    productId: string, 
    orderedQty: number,
    dispatchedQty: number,
    deliveredQty: number,
    shortQty?: number,
    damagedQty?: number,
    reason?: string,
    evidence?: string[]
  }[];
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}
