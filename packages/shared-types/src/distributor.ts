export interface Distributor {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  ownerName: string;
  mobile: string;
  status: 'Active' | 'Inactive';
  
  location: {
    address: string;
    city: string;
    state: string; // Used for GST logic
    pinCode: string;
    latitude: number;
    longitude: number;
  };
  
  tax: {
    gstin?: string;
    pan?: string;
  };

  fillRate?: number;
  pendingOrders?: number;
  outstandingBalance?: number;

  createdAt: string;
  updatedAt: string;
}
