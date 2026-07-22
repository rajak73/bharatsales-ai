import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ClaimStatus } from '@bharatsales/shared-types';

@Schema({ timestamps: true })
export class Claim extends Document {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Distributor' })
  distributorId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Outlet' })
  outletId?: string;

  @Prop({ required: true, unique: true })
  claimNumber: string;

  @Prop({ required: true, enum: ['Scheme', 'Damage', 'Expiry', 'Price Difference', 'Other'] })
  type: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, default: 'Pending' })
  status: ClaimStatus;

  @Prop()
  reason?: string;

  @Prop({ enum: ['Order', 'Return', 'Invoice'] })
  referenceDocumentType?: string;

  @Prop()
  referenceDocumentId?: string;

  @Prop([String])
  attachments?: string[];

  @Prop({ required: true })
  submittedByUserId: string;

  @Prop()
  approvedByUserId?: string;

  @Prop()
  approvedAt?: Date;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
ClaimSchema.index({ organizationId: 1, status: 1 });
ClaimSchema.index({ organizationId: 1, claimNumber: 1 }, { unique: true });
