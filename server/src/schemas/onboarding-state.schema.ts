import { Schema, Document } from 'mongoose';

export type OnboardingStateDocument = OnboardingState & Document;

export interface OnboardingState {
  organizationId: string;
  currentStep: number;
  company: any;
  policies: any;
  hierarchy: any;
  users: any;
  products: any;
  channels: any;
  isComplete: boolean;
}

export const OnboardingStateSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true, unique: true },
    currentStep: { type: Number, required: true, default: 1 },
    company: { type: Object, default: {} },
    policies: { type: Object, default: {} },
    hierarchy: { type: Object, default: {} },
    users: { type: Object, default: {} },
    products: { type: Object, default: {} },
    channels: { type: Object, default: {} },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'onboarding_states' },
);
