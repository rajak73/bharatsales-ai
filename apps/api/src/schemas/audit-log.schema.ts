import { Schema, Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export interface AuditLog {
  organizationId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityName: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: string;
  reason?: string;
}

export const AuditLogSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    entityName: { type: String, required: true },
    entityId: { type: String },
    details: { type: Object },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    reason: { type: String },
  },
  { timestamps: true, collection: 'audit_logs' },
);
