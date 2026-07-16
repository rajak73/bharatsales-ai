export interface Outlet {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  ownerName: string;
  category: string;
  tier: 'A' | 'B' | 'C' | 'D';
  status: 'Active' | 'Inactive' | 'Pending Approval';
  mobile: string;
  location: {
    address: string;
    state: string;
    pinCode: string;
    latitude: number;
    longitude: number;
    geofenceRadiusMeters: number;
  };
  commercial: {
    priceListId?: string;
    creditLimit: number;
    paymentTermsDays: number;
    outstandingBalance: number;
    assignedDistributorId?: string;
  };
  tax: {
    gstin?: string;
    pan?: string;
  };
  createdAt: string;
  updatedAt: string;
}
