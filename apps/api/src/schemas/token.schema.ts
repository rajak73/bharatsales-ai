import { Schema, Document } from 'mongoose';

export type TokenDocument = Token & Document;

export interface Token {
  userId: string;
  token: string;
  type: 'OTP' | 'PASSWORD_RESET' | 'INVITATION' | 'EMAIL_VERIFICATION';
  expiresAt: Date;
  used: boolean;
}

export const TokenSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true },
    type: { type: String, required: true, enum: ['OTP', 'PASSWORD_RESET', 'INVITATION', 'EMAIL_VERIFICATION'] },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'tokens' },
);
// Expire documents automatically (TTL index)
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Perf: reset/invite/verify links look tokens up by value.
TokenSchema.index({ token: 1 });
