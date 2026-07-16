import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, unique: true })
  refreshToken: string;

  @Prop()
  deviceInfo?: string;

  @Prop()
  ipAddress?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, default: false })
  revoked: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
