export interface Settings {
  organizationId: string;
  name: string;
  industry: string;
  timezone: string;
  currency: string;
  fiscalYearStart: string;
  geofenceRadius: string;
  gpsAccuracy: string;
  workingDays: string[];
  shiftStart: string;
  shiftEnd: string;
  orderApprovalThreshold: string;
  discountAuthority: string;
  gstNumber?: string;
  address?: string;
  country?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}
