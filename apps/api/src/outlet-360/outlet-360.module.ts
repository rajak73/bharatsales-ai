import { Module } from '@nestjs/common';
import { Outlet360Controller } from './outlet-360.controller';
import { Outlet360Service } from './outlet-360.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OutletSchema, OrderSchema, VisitSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Visit', schema: VisitSchema }
    ])
  ],
  controllers: [Outlet360Controller],
  providers: [Outlet360Service],
})
export class Outlet360Module {}
