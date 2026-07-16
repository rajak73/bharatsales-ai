import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportJob, ImportJobSchema, Product, ProductSchema, Outlet, OutletSchema } from '../schemas';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ImportJob.name, schema: ImportJobSchema },
    { name: 'Product', schema: ProductSchema },
    { name: 'Outlet', schema: OutletSchema }
  ])],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService]
})
export class ImportsModule {}
