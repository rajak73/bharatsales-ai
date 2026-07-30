import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ timestamps: true, collection: 'support_tickets' })
export class SupportTicket {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  raisedByUserId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' })
  status: 'Open' | 'In Progress' | 'Resolved';

  @Prop({ required: true, enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  priority: 'Low' | 'Medium' | 'High';
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
