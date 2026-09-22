import { Schema, Document } from 'mongoose';

export type OutletDocument = Outlet & Document;

interface Location {
  address: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
}

interface Commercial {
  priceListId?: string;
  creditLimit: number;
  paymentTermsDays: number;
  outstandingBalance: number;
  assignedDistributorId?: string;
}

interface Tax {
  gstin?: string;
  pan?: string;
}

const LocationSchema = new Schema(
  {
    address: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    geofenceRadiusMeters: { type: Number, default: 5 },
  },
  { _id: false },
);

const CommercialSchema = new Schema(
  {
    priceListId: { type: String },
    creditLimit: { type: Number, required: true, min: 0 },
    paymentTermsDays: { type: Number, required: true, min: 0 },
    outstandingBalance: { type: Number, required: true, default: 0 },
    assignedDistributorId: { type: String },
  },
  { _id: false },
);

const TaxSchema = new Schema(
  {
    gstin: { type: String },
    pan: { type: String },
  },
  { _id: false },
);

export interface Outlet {
  organizationId: string;
  code: string;
  name: string;
  ownerName: string;
  category: string;
  tier: 'A' | 'B' | 'C' | 'D';
  status: 'Active' | 'Inactive' | 'Pending Approval';
  mobile: string;
  location: Location;
  commercial: Commercial;
  tax: Tax;
  territoryId?: string;
}

export const OutletSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    category: { type: String, required: true },
    tier: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
    status: { type: String, required: true, enum: ['Active', 'Inactive', 'Pending Approval'], default: 'Active' },
    mobile: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    commercial: { type: CommercialSchema, required: true },
    tax: { type: TaxSchema, required: true },
    territoryId: { type: String, index: true },
  },
  { timestamps: true, collection: 'outlets' },
);

// Compound index for uniqueness across organization
OutletSchema.index({ organizationId: 1, code: 1 }, { unique: true });
