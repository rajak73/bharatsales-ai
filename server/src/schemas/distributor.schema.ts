import { Schema, Document } from 'mongoose';

export type DistributorDocument = Distributor & Document;

interface Location {
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
}

interface TaxInfo {
  gstin?: string;
  pan?: string;
}

interface Commercial {
  creditLimit: number;
  outstandingBalance: number;
}

const LocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const TaxInfoSchema = new Schema(
  {
    gstin: { type: String },
    pan: { type: String },
  },
  { _id: false },
);

const CommercialSchema = new Schema(
  {
    creditLimit: { type: Number, required: true, min: 0, default: 0 },
    outstandingBalance: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

export interface Distributor {
  organizationId: string;
  name: string;
  code: string;
  ownerName: string;
  mobile: string;
  status: 'Active' | 'Inactive';
  location: Location;
  tax: TaxInfo;
  commercial?: Commercial;
  territoryIds?: string[];
  productIds?: string[];
}

export const DistributorSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    ownerName: { type: String, required: true },
    mobile: { type: String, required: true },
    status: { type: String, required: true, enum: ['Active', 'Inactive'] },

    location: { type: LocationSchema, required: true },
    tax: { type: TaxInfoSchema, required: true },
    commercial: { type: CommercialSchema, default: { creditLimit: 0, outstandingBalance: 0 } },

    // Territory + product assignment (BRD "Distributor Management": Organization
    // Admin creates a distributor, then assigns Territory and Products to it).
    territoryIds: { type: [String], default: [] },
    productIds: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'distributors' },
);
DistributorSchema.index({ organizationId: 1, code: 1 }, { unique: true });
