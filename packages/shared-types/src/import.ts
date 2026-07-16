export interface ImportHistoryItem {
  id: string;
  organizationId: string;
  type: string;
  fileName: string;
  rows: number;
  valid: number;
  invalid: number;
  status: string;
  date: string;
}

export interface ImportTypeConfig {
  id: string;
  name: string;
  icon: string;
  count: number;
  lastImport: string;
}
