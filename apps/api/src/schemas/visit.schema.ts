import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Visit extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Outlet', required: true })
  outlet: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  checkInTime: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop({ type: { lat: Number, lng: Number, accuracy: Number }, required: true })
  checkInLocation: { lat: number; lng: number; accuracy: number };

  @Prop()
  distanceFromOutlet?: number;

  @Prop()
  isWithinGeofence?: boolean;

  @Prop({ required: true, enum: ['Active', 'Completed'] })
  status: string;

  @Prop({ type: [Object], default: [] })
  activities?: any[];
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
