import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { LocalDiskStorageProvider } from './storage.provider';

@Module({
  controllers: [UploadsController],
  providers: [LocalDiskStorageProvider],
})
export class UploadsModule {}
