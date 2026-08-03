import { Module } from '@nestjs/common';
import { BrevoEmailProvider } from './email.provider';

@Module({
  providers: [BrevoEmailProvider],
  exports: [BrevoEmailProvider],
})
export class CommonModule {}
