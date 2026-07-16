export interface ScheduledReport {
  id: string;
  organizationId: string;
  name: string;
  frequency: string;
  time: string;
  recipients: string;
  format: string;
  lastSent: string;
  status: string;
}

export interface RecentExport {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  size: string;
  generated: string;
  expires: string;
}
