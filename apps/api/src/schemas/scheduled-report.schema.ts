import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ScheduledReport as IScheduledReport } from '@bharatsales/shared-types';

export type ScheduledReportDocument = ScheduledReport & Document;

@Schema({ timestamps: true, collection: 'scheduled_reports' })
export class ScheduledReport implements Omit<IScheduledReport, 'id'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) frequency: string;
  @Prop({ required: true }) time: string;
  @Prop({ required: true }) recipients: string;
  @Prop({ required: true }) format: string;
  @Prop() lastSent: string;
  @Prop({ required: true, default: 'Active' }) status: string;
}

export const ScheduledReportSchema = SchemaFactory.createForClass(ScheduledReport);

ScheduledReportSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
