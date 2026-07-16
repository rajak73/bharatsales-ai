import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ApprovalRule extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  trigger: string;

  @Prop({ required: true })
  approver: string;

  @Prop({ required: true, default: true })
  enabled: boolean;
}

export const ApprovalRuleSchema = SchemaFactory.createForClass(ApprovalRule);
