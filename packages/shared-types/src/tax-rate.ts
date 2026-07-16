export interface TaxRate {
  id: string;
  organizationId: string;
  hsn: string;
  description: string;
  gst: string;
  cgst: string;
  sgst: string;
  igst: string;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}
