import { Schema, Document, Types } from 'mongoose';

export interface Visit extends Document {
  user: Types.ObjectId;
  outlet: Types.ObjectId;
  organizationId: Types.ObjectId;
  checkInTime: Date;
  checkOutTime?: Date;
  durationMinutes?: number;
  checkInLocation: { lat: number; lng: number; accuracy: number };
  checkOutLocation?: { lat: number; lng: number; accuracy: number };
  photoUrl?: string;
  distanceFromOutlet?: number;
  isWithinGeofence?: boolean;
  status: string;
  activities?: any[];
  idempotencyKey?: string;
}

// NOTE: under @nestjs/mongoose, `@Prop({ type: Types.ObjectId })` compiled to Mixed (the bson class was
// treated as an empty nested class -> `{}`), so these refs never cast to ObjectId. They are kept Mixed
// on purpose so existing documents and string-id queries behave exactly as before the migration.
export const VisitSchema = new Schema(
  {
    user: { type: Schema.Types.Mixed, ref: 'User', required: true },
    outlet: { type: Schema.Types.Mixed, ref: 'Outlet', required: true },
    organizationId: { type: Schema.Types.Mixed, ref: 'Organization', required: true },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    durationMinutes: { type: Number },
    checkInLocation: { type: { lat: Number, lng: Number, accuracy: Number }, required: true },
    checkOutLocation: { type: { lat: Number, lng: Number, accuracy: Number } },
    photoUrl: { type: String },
    distanceFromOutlet: { type: Number },
    isWithinGeofence: { type: Boolean },
    status: { type: String, required: true, enum: ['Active', 'Completed'] },
    activities: { type: [Object], default: [] },
    idempotencyKey: { type: String },
  },
  { timestamps: true },
);

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
