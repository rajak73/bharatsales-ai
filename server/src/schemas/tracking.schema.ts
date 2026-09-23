import { Schema, Document, Types } from 'mongoose';

export interface LocationPing extends Document {
  user: Types.ObjectId;
  organizationId: Types.ObjectId;
  attendanceSession: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy: number;
  deviceTimestamp: Date;
}

// NOTE: under @nestjs/mongoose, `@Prop({ type: Types.ObjectId })` compiled to Mixed (the bson class was
// treated as an empty nested class -> `{}`), so these refs never cast to ObjectId. They are kept Mixed
// on purpose so existing documents and string-id queries behave exactly as before the migration.
export const LocationPingSchema = new Schema(
  {
    user: { type: Schema.Types.Mixed, ref: 'User', required: true },
    organizationId: { type: Schema.Types.Mixed, ref: 'Organization', required: true, index: true },
    attendanceSession: { type: Schema.Types.Mixed, ref: 'AttendanceSession', required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    deviceTimestamp: { type: Date, required: true },
  },
  { timestamps: true },
);

// Perf: org-wide live-tracking / breadcrumb queries sorted by device time.
LocationPingSchema.index({ organizationId: 1, deviceTimestamp: -1 });
// Retention: drop pings 90 days after they reached the server. Keyed on the
// server-set `createdAt` rather than `deviceTimestamp` so a device with a
// wrong clock can't get its pings deleted early (or kept forever).
LocationPingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
