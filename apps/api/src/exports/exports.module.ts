import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportJobSchema } from '../schemas/export-job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'ExportJob', schema: ExportJobSchema }])
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService]
})
export class ExportsModule {}
