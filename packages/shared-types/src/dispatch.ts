export interface Dispatch {
  id: string;
  organizationId: string;
  orderId: string;
  vehicle: string;
  driver: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}
