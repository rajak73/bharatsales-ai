import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Integration extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  purpose: string;

  @Prop({ required: true })
  status: 'Active' | 'Inactive' | 'Configuring';

  @Prop({ type: Object, default: {} })
  config: Record<string, any>;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
