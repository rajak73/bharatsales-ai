import { Schema, Document, Types } from 'mongoose';

export interface Beat extends Document {
  name: string;
  description?: string;
  organizationId: Types.ObjectId;
  outlets: Types.ObjectId[];
  sequence: { outletId: Types.ObjectId; sequenceOrder: number }[];
  status: string;
  version: number;
}

// NOTE: under @nestjs/mongoose, `@Prop({ type: Types.ObjectId })` compiled to Mixed (the bson class was
// treated as an empty nested class -> `{}`), so these refs never cast to ObjectId. They are kept Mixed
// on purpose so existing documents and string-id queries behave exactly as before the migration.
export const BeatSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    organizationId: { type: Schema.Types.Mixed, ref: 'Organization', required: true, index: true },
    // Under Nest this compiled to an array of Mixed with NO ref (the ref was lost along with the
    // ObjectId type), so populate('outlets') was a no-op and clients receive raw outlet ids.
    // Keep it ref-less: adding the ref changes response shapes and makes populate throw a
    // CastError on legacy non-ObjectId entries.
    outlets: { type: [Schema.Types.Mixed], default: [] },
    // Planned visit order for route-deviation checks (BRD Phase 6). Additive
    // alongside `outlets` so existing consumers of the unordered list are unaffected.
    sequence: { type: [{ outletId: { type: Types.ObjectId, ref: 'Outlet' }, sequenceOrder: Number }], default: [] },
    status: { type: String, default: 'Active', enum: ['Active', 'Draft', 'Archived'] },
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

export interface BeatSchedule extends Document {
  user: Types.ObjectId;
  beat: Types.ObjectId;
  organizationId: Types.ObjectId;
  date: Date;
}

export const BeatScheduleSchema = new Schema(
  {
    user: { type: Schema.Types.Mixed, ref: 'User', required: true },
    beat: { type: Schema.Types.Mixed, ref: 'Beat', required: true },
    organizationId: { type: Schema.Types.Mixed, ref: 'Organization', required: true, index: true },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);
