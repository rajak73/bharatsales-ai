import { Injectable, Logger } from '@nestjs/common';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';
import { TallyAdapter } from './adapters/tally.adapter';

export interface IntegrationAdapter {
  connect(config: any): Promise<boolean>;
  syncData(payload: any): Promise<any>;
  disconnect(): Promise<boolean>;
}

@Injectable()
export class IntegrationsAdapterService {
  private readonly logger = new Logger(IntegrationsAdapterService.name);
  
  constructor(
    private whatsappAdapter: WhatsappAdapter,
    private tallyAdapter: TallyAdapter,
  ) {}

  getAdapter(provider: string): IntegrationAdapter {
    switch (provider.toLowerCase()) {
      case 'whatsapp':
        return this.whatsappAdapter as any as IntegrationAdapter;
      case 'tally':
      case 'tally solutions':
      case 'tally erp 9':
        return this.tallyAdapter as any as IntegrationAdapter;
      default:
        throw new Error(`Adapter for provider ${provider} is not implemented.`);
    }
  }

  async sync(provider: string, payload: any): Promise<any> {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.syncData(payload);
    } catch (error: any) {
      this.logger.error(`Failed to sync data for provider ${provider}: ${error.message}`);
      throw error;
    }
  }
}
