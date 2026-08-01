import { Module } from '@nestjs/common';
import { SendGridEmailProvider } from './email.provider';

@Module({
  providers: [SendGridEmailProvider],
  exports: [SendGridEmailProvider],
})
export class CommonModule {}
