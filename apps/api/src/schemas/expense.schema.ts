import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  status: 'Pending' | 'Approved' | 'Rejected';

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
