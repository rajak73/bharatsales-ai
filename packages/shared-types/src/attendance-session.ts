export interface AttendanceSession {
  _id: string;
  user: string;
  organizationId: string;
  startTime: string;
  endTime?: string;
  startLocation: { lat: number; lng: number; accuracy: number };
  endLocation?: { lat: number; lng: number; accuracy: number };
  status: 'Active' | 'On_Break' | 'Completed';
  deviceTimestamp?: string;
  photoUrl?: string;
  regularizationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  regularizationReason?: string;
}
