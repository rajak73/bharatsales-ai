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

  @Prop()
  durationMinutes?: number;

  @Prop({ type: { lat: Number, lng: Number, accuracy: Number }, required: true })
  checkInLocation: { lat: number; lng: number; accuracy: number };

  @Prop({ type: { lat: Number, lng: Number, accuracy: Number } })
  checkOutLocation?: { lat: number; lng: number; accuracy: number };

  @Prop()
  photoUrl?: string;

  @Prop()
  distanceFromOutlet?: number;

  @Prop()
  isWithinGeofence?: boolean;

  @Prop({ required: true, enum: ['Active', 'Completed'] })
  status: string;

  @Prop({ type: [Object], default: [] })
  activities?: any[];

  @Prop()
  idempotencyKey?: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({ user: 1, checkInTime: -1 });
VisitSchema.index({ checkInLocation: '2dsphere' });
VisitSchema.index({ organizationId: 1, checkInTime: -1 });
// partialFilterExpression (not sparse) is required here: since organizationId is
// always present, a plain compound sparse index would still enforce uniqueness
// across every document that omits idempotencyKey (they'd collide on `null`).
VisitSchema.index(
  { organizationId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
