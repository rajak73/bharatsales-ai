import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportJob, ImportJobSchema, Product, ProductSchema, Outlet, OutletSchema, UserSchema, DistributorSchema, TargetSchema, InventorySchema } from '../schemas';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ImportJob.name, schema: ImportJobSchema },
    { name: 'Product', schema: ProductSchema },
    { name: 'Outlet', schema: OutletSchema },
    { name: 'User', schema: UserSchema },
    { name: 'Distributor', schema: DistributorSchema },
    { name: 'Target', schema: TargetSchema },
    { name: 'Inventory', schema: InventorySchema }
  ])],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService]
})
export class ImportsModule {}
