export interface ExportJob {
  id: string;
  organizationId: string;
  requestedByUserId: string;
  entityType: string;
  filters: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  fileUrl?: string;
  errorDetails?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
