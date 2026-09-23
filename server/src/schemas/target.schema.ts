import { Schema, Document } from 'mongoose';

export type TargetDocument = Target & Document;

export interface Target {
  organizationId: string;
  entityType: 'User' | 'Territory' | 'Outlet';
  entityId: string;
  period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  startDate: string;
  endDate: string;
  targetMetric?: 'SalesValue' | 'VisitCount' | 'ProductiveCalls' | 'CollectionValue';
  targetValue: number;
  actualValue: number;
  status: 'On Track' | 'At Risk' | 'Achieved' | 'Missed';
}

export const TargetSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    entityType: { type: String, required: true, enum: ['User', 'Territory', 'Outlet'] },
    entityId: { type: String, required: true, index: true },

    period: { type: String, required: true, enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'] },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },

    // The web targets page sends targetMetric and TargetsService reads it; without this path
    // Mongoose strict mode dropped it and every target was computed as SalesValue.
    targetMetric: { type: String, enum: ['SalesValue', 'VisitCount', 'ProductiveCalls', 'CollectionValue'], default: 'SalesValue' },
    targetValue: { type: Number, required: true, min: 0 },
    actualValue: { type: Number, required: true, default: 0, min: 0 },

    status: { type: String, required: true, enum: ['On Track', 'At Risk', 'Achieved', 'Missed'], default: 'On Track' },
  },
  { timestamps: true, collection: 'targets' },
);
TargetSchema.index({ organizationId: 1, entityId: 1 });
