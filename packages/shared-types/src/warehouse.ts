export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  location: string;
  capacity: string;
  utilization?: number;
  manager?: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  createdAt: string;
  updatedAt: string;
}
