import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { OutletsController } from './outlets.controller';
import { OutletsService } from './outlets.service';
import { Outlet, OutletSchema } from '../schemas/outlet.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Visit, VisitSchema } from '../schemas/visit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Outlet.name, schema: OutletSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Visit.name, schema: VisitSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bharatsales-super-secret-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [OutletsController],
  providers: [OutletsService],
})
export class OutletsModule {}
