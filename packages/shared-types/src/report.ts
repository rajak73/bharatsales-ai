export interface Report {
  id: string;
  organizationId: string;
  name: string;
  desc: string;
  category: string;
  lastRun: string;
  status: string;
}

export interface ReportStats {
  total: number;
  scheduled: number;
  generatedToday: number;
  pendingExport: number;
}
