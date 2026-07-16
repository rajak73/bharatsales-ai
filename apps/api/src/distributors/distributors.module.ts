import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';
import { Distributor, DistributorSchema } from '../schemas/distributor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Distributor.name, schema: DistributorSchema }]),
  ],
  controllers: [DistributorsController],
  providers: [DistributorsService],
  exports: [DistributorsService],
})
export class DistributorsModule {}
