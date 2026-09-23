import { Schema, Document } from 'mongoose';

export interface Integration extends Document {
  organizationId: string;
  name: string;
  provider: string;
  purpose: string;
  status: 'Active' | 'Inactive' | 'Configuring';
  config: Record<string, any>;
}

export const IntegrationSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    provider: { type: String, required: true },
    purpose: { type: String, required: true },
    status: { type: String, required: true },
    config: { type: Object, default: {} },
  },
  { timestamps: true },
);
