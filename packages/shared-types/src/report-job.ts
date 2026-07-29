export interface ReportJob {
  id: string;
  organizationId: string;
  jobId: string;
  status: 'Processing' | 'Completed' | 'Failed';
  progress: number;
  data?: string;
  url?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
