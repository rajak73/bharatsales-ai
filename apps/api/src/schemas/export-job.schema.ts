import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExportJobDocument = ExportJob & Document;

@Schema({ timestamps: true, collection: 'export_jobs' })
export class ExportJob {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, index: true }) requestedByUserId: string;
  @Prop({ required: true }) entityType: string; // e.g., 'orders', 'attendance'
  @Prop({ type: Object, default: {} }) filters: Record<string, any>;
  @Prop({ required: true, enum: ['queued', 'processing', 'completed', 'failed', 'expired'], default: 'queued' }) status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  @Prop() fileUrl?: string;
  @Prop() errorDetails?: string;
  @Prop() expiresAt?: Date;
}

export const ExportJobSchema = SchemaFactory.createForClass(ExportJob);
ExportJobSchema.index({ organizationId: 1, requestedByUserId: 1 });
