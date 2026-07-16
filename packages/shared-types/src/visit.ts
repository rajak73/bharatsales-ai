export interface Visit {
  _id: string;
  user: string;
  outlet: string;
  organizationId: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation: { lat: number; lng: number; accuracy: number };
  distanceFromOutlet?: number;
  isWithinGeofence?: boolean;
  status: 'Active' | 'Completed';
}
