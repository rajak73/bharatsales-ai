import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { Integration, IntegrationSchema } from '../schemas/integration.schema';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';
import { TallyAdapter } from './adapters/tally.adapter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Integration.name, schema: IntegrationSchema }]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, WhatsappAdapter, TallyAdapter],
  exports: [IntegrationsService, WhatsappAdapter, TallyAdapter]
})
export class IntegrationsModule {}
