import { Schema, Document } from 'mongoose';

export interface ApprovalRule extends Document {
  organizationId: string;
  trigger: string;
  approver: string;
  enabled: boolean;
}

export const ApprovalRuleSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    trigger: { type: String, required: true },
    approver: { type: String, required: true },
    enabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
