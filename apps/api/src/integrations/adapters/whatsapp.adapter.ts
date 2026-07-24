import { Injectable, Logger } from '@nestjs/common';
import { IntegrationAdapter } from '../integrations-adapter.service';
import axios from 'axios';

@Injectable()
export class WhatsappAdapter implements IntegrationAdapter {
  private readonly logger = new Logger(WhatsappAdapter.name);
  
  // E.g. https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages
  private readonly apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/mock_id/messages';

  async connect(config: any): Promise<boolean> {
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      this.logger.warn(`[WHATSAPP-ADAPTER] WHATSAPP_ACCESS_TOKEN missing. Operating in mock mode.`);
    } else {
      this.logger.log(`[WHATSAPP-ADAPTER] Connecting to WhatsApp Business API...`);
    }
    return true;
  }

  async syncData(payload: any): Promise<any> {
    if (payload.type === 'Delivery') {
      return this.sendWhatsAppMessage(payload.phoneNumber, `Delivery update for order ${payload.orderId}. Dispatch ID: ${payload.dispatchId}`);
    } else if (payload.type === 'Dispatch') {
      return this.sendWhatsAppMessage(payload.phoneNumber, `Dispatch created for order ${payload.orderId}. Vehicle: ${payload.vehicle}, Driver: ${payload.driver}`);
    } else if (payload.type === 'Notification' || payload.type === 'Invoice') {
      return this.sendWhatsAppMessage(payload.phone, payload.message);
    }
    return false;
  }

  async disconnect(): Promise<boolean> {
    return true;
  }

  async sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    try {
      this.logger.log(`[WHATSAPP-ADAPTER] Sending message to ${phone}`);
      
      if (process.env.WHATSAPP_ACCESS_TOKEN) {
        await axios.post(
          this.apiUrl,
          {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        this.logger.log(`[WHATSAPP-ADAPTER] Message successfully delivered to ${phone} via Meta Graph API.`);
      } else {
        // Fallback simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500));
        this.logger.log(`[WHATSAPP-ADAPTER] Message successfully sent to ${phone} (Mock Mode).`);
      }
      
      return true;
    } catch (error: any) {
      this.logger.error(`[WHATSAPP-ADAPTER] Failed to send WhatsApp message to ${phone}. ${error.message}`);
      return false;
    }
  }
}
