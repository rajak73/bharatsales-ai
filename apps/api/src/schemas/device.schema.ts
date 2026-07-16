import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Device extends Document {
  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  user: string;

  @Prop({ name: 'model', required: true })
  deviceModel: string;

  @Prop({ required: true })
  os: string;

  @Prop({ required: true })
  appVersion: string;

  @Prop({ required: true })
  lastSync: string;

  @Prop({ required: true })
  status: 'Online' | 'Offline' | 'Inactive';
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
