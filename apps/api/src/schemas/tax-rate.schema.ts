import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TaxRate extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  percentage: number;

  @Prop({ required: true })
  country: string;

  @Prop()
  region?: string;
}

export const TaxRateSchema = SchemaFactory.createForClass(TaxRate);
