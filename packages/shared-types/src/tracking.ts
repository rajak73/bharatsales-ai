export interface LocationPing {
  id?: string;
  user: string;
  organizationId: string;
  attendanceSession: string;
  lat: number;
  lng: number;
  accuracy: number;
  deviceTimestamp: string;
}
