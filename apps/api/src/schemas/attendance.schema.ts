import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AttendanceSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ type: { lat: Number, lng: Number, accuracy: Number }, required: true })
  startLocation: { lat: number; lng: number; accuracy: number };

  @Prop({ type: { lat: Number, lng: Number, accuracy: Number } })
  endLocation?: { lat: number; lng: number; accuracy: number };

  @Prop({ required: true, enum: ['Active', 'On_Break', 'Completed'] })
  status: string;

  @Prop()
  deviceTimestamp?: Date;

  @Prop()
  photoUrl?: string;

  @Prop({ enum: ['PENDING', 'APPROVED', 'REJECTED'], default: null })
  regularizationStatus?: string;

  @Prop()
  regularizationReason?: string;
}

export const AttendanceSessionSchema = SchemaFactory.createForClass(AttendanceSession);
