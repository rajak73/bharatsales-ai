import { Schema, Document } from 'mongoose';

export type ReportJobDocument = ReportJob & Document;

export interface ReportJob {
  organizationId: string;
  jobId: string;
  status: 'Processing' | 'Completed' | 'Failed';
  progress: number;
  data?: string;
  url?: string;
  error?: string;
  /** User id (JWT sub) that ran the report; only they (or an Organization Admin) may fetch it. */
  requestedBy?: string;
}

export const ReportJobSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true, unique: true },
    status: { type: String, required: true, enum: ['Processing', 'Completed', 'Failed'], default: 'Processing' },
    progress: { type: Number, required: true, default: 0 },
    data: { type: String },
    url: { type: String },
    error: { type: String },
    requestedBy: { type: String, index: true },
  },
  { timestamps: true, collection: 'report_jobs' },
);

ReportJobSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
