import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class LocationPing extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AttendanceSession', required: true })
  attendanceSession: Types.ObjectId;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  accuracy: number;

  @Prop({ required: true })
  deviceTimestamp: Date;
}

export const LocationPingSchema = SchemaFactory.createForClass(LocationPing);
