import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { OutletsController } from './outlets.controller';
import { OutletsService } from './outlets.service';
import { Outlet, OutletSchema } from '../schemas/outlet.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Visit, VisitSchema } from '../schemas/visit.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { UserSchema } from '../schemas/user.schema';

import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    HierarchyModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Outlet.name, schema: OutletSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: 'User', schema: UserSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [OutletsController],
  providers: [OutletsService],
})
export class OutletsModule {}
