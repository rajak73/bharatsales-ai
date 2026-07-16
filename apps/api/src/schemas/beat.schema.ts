import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Beat extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Outlet' }], default: [] })
  outlets: Types.ObjectId[];

  @Prop({ default: 'Active', enum: ['Active', 'Draft', 'Archived'] })
  status: string;

  @Prop({ required: true, default: 1 })
  version: number;
}

export const BeatSchema = SchemaFactory.createForClass(Beat);

@Schema({ timestamps: true })
export class BeatSchedule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Beat', required: true })
  beat: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;
}

export const BeatScheduleSchema = SchemaFactory.createForClass(BeatSchedule);
