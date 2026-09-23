import { Schema, Document, Types } from 'mongoose';

export interface AttendanceSession extends Document {
  user: Types.ObjectId;
  organizationId: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  startLocation: { lat: number; lng: number; accuracy: number };
  endLocation?: { lat: number; lng: number; accuracy: number };
  status: string;
  deviceTimestamp?: Date;
  photoUrl?: string;
  regularizationStatus?: string;
  regularizationReason?: string;
}

// NOTE: under @nestjs/mongoose, `@Prop({ type: Types.ObjectId })` compiled to Mixed (the bson class was
// treated as an empty nested class -> `{}`), so these refs never cast to ObjectId. They are kept Mixed
// on purpose so existing documents and string-id queries behave exactly as before the migration.
export const AttendanceSessionSchema = new Schema(
  {
    user: { type: Schema.Types.Mixed, ref: 'User', required: true },
    organizationId: { type: Schema.Types.Mixed, ref: 'Organization', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    startLocation: { type: { lat: Number, lng: Number, accuracy: Number }, required: true },
    endLocation: { type: { lat: Number, lng: Number, accuracy: Number } },
    status: { type: String, required: true, enum: ['Active', 'On_Break', 'Completed'] },
    deviceTimestamp: { type: Date },
    photoUrl: { type: String },
    regularizationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: null },
    regularizationReason: { type: String },
  },
  { timestamps: true },
);

// Perf: active-session lookups per user (findOne({ user, status: 'Active' })).
AttendanceSessionSchema.index({ user: 1, status: 1 });
