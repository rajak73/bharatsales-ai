import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ReportJob as IReportJob } from '@bharatsales/shared-types';

export type ReportJobDocument = ReportJob & Document;

@Schema({ timestamps: true, collection: 'report_jobs' })
export class ReportJob implements Omit<IReportJob, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, index: true, unique: true }) jobId: string;
  @Prop({ required: true, enum: ['Processing', 'Completed', 'Failed'], default: 'Processing' }) status: 'Processing' | 'Completed' | 'Failed';
  @Prop({ required: true, default: 0 }) progress: number;
  @Prop() data?: string;
  @Prop() url?: string;
  @Prop() error?: string;
}

export const ReportJobSchema = SchemaFactory.createForClass(ReportJob);

ReportJobSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
