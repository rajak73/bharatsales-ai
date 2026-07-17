import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OnboardingStateDocument = OnboardingState & Document;

@Schema({ timestamps: true, collection: 'onboarding_states' })
export class OnboardingState {
  @Prop({ required: true, index: true, unique: true })
  organizationId: string;

  @Prop({ required: true, default: 1 })
  currentStep: number;

  @Prop({ type: Object, default: {} })
  company: any;

  @Prop({ type: Object, default: {} })
  policies: any;

  @Prop({ type: Object, default: {} })
  hierarchy: any;

  @Prop({ type: Object, default: {} })
  users: any;

  @Prop({ type: Object, default: {} })
  products: any;

  @Prop({ type: Object, default: {} })
  channels: any;

  @Prop({ type: Boolean, default: false })
  isComplete: boolean;
}

export const OnboardingStateSchema = SchemaFactory.createForClass(OnboardingState);
