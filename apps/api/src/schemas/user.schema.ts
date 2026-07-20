import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User as IUser, UserRole } from '@bharatsales/shared-types';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User implements Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password?: string; // Hashed password

  @Prop({ required: true, type: String })
  role: UserRole;

  @Prop()
  mobile?: string;

  @Prop({ required: true, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' })
  status: 'Active' | 'Inactive' | 'Suspended';

  @Prop([String])
  territoryIds?: string[];

  @Prop({ default: 0 })
  failedLoginAttempts?: number;

  @Prop()
  lockedUntil?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
