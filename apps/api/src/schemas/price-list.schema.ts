import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PriceList extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: 'Customer' | 'Customer Group';

  @Prop({ required: true })
  status: 'Active' | 'Inactive';

  @Prop({ required: true })
  validFrom: string;

  @Prop()
  validTo?: string;

  @Prop({ type: Object, default: {} })
  pricingRules: Record<string, any>;
}

export const PriceListSchema = SchemaFactory.createForClass(PriceList);
