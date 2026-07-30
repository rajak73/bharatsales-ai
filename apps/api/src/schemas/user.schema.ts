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

  @Prop({ required: true, enum: ['Active', 'Inactive', 'Suspended', 'Invited'], default: 'Active' })
  status: 'Active' | 'Inactive' | 'Suspended' | 'Invited';

  @Prop([String])
  territoryIds?: string[];

  @Prop({ default: 0 })
  failedLoginAttempts?: number;

  @Prop()
  lockedUntil?: Date;

  // True platform operator flag — distinct from the tenant-scoped `role` string.
  // Never settable via any public API path; only via the seed-platform-admin script.
  @Prop({ default: false })
  platformAdmin?: boolean;

  // Set when provisioning a Distributor-role account, to scope their data access
  // to only their own distributor's inventory/returns/collections/staff.
  @Prop()
  distributorId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
