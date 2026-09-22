import { Schema, Document } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

export interface SupportTicket {
  organizationId: string;
  raisedByUserId: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
}

export const SupportTicketSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    raisedByUserId: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  },
  { timestamps: true, collection: 'support_tickets' },
);
