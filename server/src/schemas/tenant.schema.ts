import { Schema, Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

interface Branding {
  logoUrl?: string;
  primaryColor?: string;
}

interface BillingHistory {
  id: string;
  date: string;
  plan: string;
  amount: string;
  status: string;
}

const BrandingSchema = new Schema(
  {
    logoUrl: { type: String },
    primaryColor: { type: String },
  },
  { _id: false },
);

const BillingHistorySchema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    plan: { type: String, required: true },
    amount: { type: String, required: true },
    status: { type: String, required: true },
  },
  { _id: false },
);

export interface Tenant {
  name: string;
  status: 'Pending Approval' | 'Trial' | 'Active' | 'Past Due' | 'Suspended' | 'Archived' | 'Expired';
  plan: 'Starter' | 'Growth' | 'Enterprise';
  timezone?: string;
  currency?: string;
  billingCycle?: 'Monthly' | 'Annual';
  nextBillingDate?: string;
  subscriptionUsersLimit?: number;
  subscriptionStorageUsed?: string;
  billingHistory?: BillingHistory[];
  branding?: Branding;
  gstNumber?: string;
  address?: string;
  country?: string;
  industry?: string;
  geofenceRadius?: string;
  gpsAccuracy?: string;
  workingDays?: string[];
  shiftStart?: string;
  shiftEnd?: string;
  orderApprovalThreshold?: string;
  discountAuthority?: string;
  fiscalYearStart?: string;
}

export const TenantSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Pending Approval', 'Trial', 'Active', 'Past Due', 'Suspended', 'Archived', 'Expired'],
      default: 'Trial',
    },
    plan: { type: String, required: true, enum: ['Starter', 'Growth', 'Enterprise'], default: 'Starter' },
    timezone: { type: String },
    currency: { type: String },
    billingCycle: { type: String, enum: ['Monthly', 'Annual'], default: 'Annual' },
    nextBillingDate: { type: String },
    subscriptionUsersLimit: { type: Number, default: 10 },
    subscriptionStorageUsed: { type: String, default: '5GB' },
    billingHistory: { type: [BillingHistorySchema], default: [] },
    branding: { type: BrandingSchema },

    // Organization profile (BRD Section 11)
    gstNumber: { type: String },
    address: { type: String },
    country: { type: String },

    // Settings page fields — must be declared here or Mongoose strict mode
    // silently strips them from `$set` on findByIdAndUpdate.
    industry: { type: String },
    geofenceRadius: { type: String },
    gpsAccuracy: { type: String },
    workingDays: { type: [String] },
    shiftStart: { type: String },
    shiftEnd: { type: String },
    orderApprovalThreshold: { type: String },
    discountAuthority: { type: String },
    fiscalYearStart: { type: String },
  },
  { timestamps: true, collection: 'tenants' },
);
