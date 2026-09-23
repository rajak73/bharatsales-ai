import { Schema, Document } from 'mongoose';

export type NotificationLogDocument = NotificationLog & Document;

export interface NotificationLog {
  organizationId: string;
  method: 'SMS' | 'WhatsApp' | 'Email';
  to: string;
  message?: string;
  templateId?: string;
  payload?: any;
  status: 'Pending' | 'Sent' | 'Failed';
}

export const NotificationLogSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    method: { type: String, required: true, enum: ['SMS', 'WhatsApp', 'Email'] },
    to: { type: String, required: true },
    message: { type: String },
    templateId: { type: String },
    payload: { type: Object },
    status: { type: String, required: true, enum: ['Pending', 'Sent', 'Failed'], default: 'Sent' },
  },
  { timestamps: true, collection: 'notification_logs' },
);
