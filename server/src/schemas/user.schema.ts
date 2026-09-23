import { Schema, Document } from 'mongoose';
import { UserRole } from '@bharatsales/shared-types';

export type UserDocument = User & Document;

export interface User {
  organizationId: string;
  email: string;
  name: string;
  password?: string; // Hashed password
  role: UserRole;
  mobile?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Invited';
  emailVerified?: boolean;
  territoryIds?: string[];
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  platformAdmin?: boolean;
  distributorId?: string;
  pushToken?: string;
}

export const UserSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    mobile: { type: String },
    status: { type: String, required: true, enum: ['Active', 'Inactive', 'Suspended', 'Invited'], default: 'Active' },

    // Defaults to true so every pre-existing/admin-provisioned user (seed
    // data, Super Admin-created tenants, accepted invitations) stays
    // unaffected — only the self-registration flow explicitly sets this to
    // false at signup, gating login until the emailed link is clicked.
    emailVerified: { type: Boolean, default: true },

    territoryIds: { type: [String] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },

    // True platform operator flag — distinct from the tenant-scoped `role` string.
    // Never settable via any public API path; only via the seed-platform-admin script.
    platformAdmin: { type: Boolean, default: false },

    // Set when provisioning a Distributor-role account, to scope their data access
    // to only their own distributor's inventory/returns/collections/staff.
    distributorId: { type: String },

    // Expo push token for the mobile app (Sales Rep / Distributor), registered
    // after login. Purely additive — no other auth/session flow reads this.
    pushToken: { type: String },
  },
  { timestamps: true, collection: 'users' },
);
