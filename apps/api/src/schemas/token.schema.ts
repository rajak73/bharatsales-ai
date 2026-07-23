import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({ timestamps: true, collection: 'tokens' })
export class Token {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: ['OTP', 'PASSWORD_RESET', 'INVITATION'] })
  type: 'OTP' | 'PASSWORD_RESET' | 'INVITATION';

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
// Expire documents automatically (TTL index)
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
