import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Approval extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  outlet: string;

  @Prop({ required: true })
  order: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  priority: 'High' | 'Medium' | 'Low';

  @Prop({ required: true })
  requestedBy: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true, default: 'Pending' })
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);
