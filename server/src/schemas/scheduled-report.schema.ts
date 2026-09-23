import { Schema, Document } from 'mongoose';

export type ScheduledReportDocument = ScheduledReport & Document;

export interface ScheduledReport {
  organizationId: string;
  name: string;
  frequency: string;
  time: string;
  recipients: string;
  format: string;
  lastSent: string;
  status: string;
}

export const ScheduledReportSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    frequency: { type: String, required: true },
    time: { type: String, required: true },
    recipients: { type: String, required: true },
    format: { type: String, required: true },
    lastSent: { type: String },
    status: { type: String, required: true, default: 'Active' },
  },
  { timestamps: true, collection: 'scheduled_reports' },
);

ScheduledReportSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
