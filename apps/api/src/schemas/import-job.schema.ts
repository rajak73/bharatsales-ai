import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ImportJobDocument = ImportJob & Document;

@Schema({ timestamps: true, collection: 'import_jobs' })
export class ImportJob {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true, default: 0 })
  rows: number;

  @Prop({ required: true, default: 0 })
  valid: number;

  @Prop({ required: true, default: 0 })
  invalid: number;

  @Prop({ required: true, enum: ['Pending', 'Processing', 'Completed', 'Failed'] })
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';

  @Prop()
  errorMessage?: string;
}

export const ImportJobSchema = SchemaFactory.createForClass(ImportJob);
