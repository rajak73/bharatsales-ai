import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappAdapter {
  private readonly logger = new Logger(WhatsappAdapter.name);

  async sendDeliveryNotification(phoneNumber: string, orderId: string, dispatchId: string): Promise<boolean> {
    try {
      this.logger.log(`[WHATSAPP-SIM] Sending Delivery Notification for Order: ${orderId} via Dispatch: ${dispatchId} to ${phoneNumber}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.logger.log(`[WHATSAPP-SIM] Notification successfully sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`[WHATSAPP-SIM] Failed to send notification to ${phoneNumber}`, error);
      return false;
    }
  }

  async sendDispatchNotification(phoneNumber: string, orderId: string, vehicle: string, driver: string): Promise<boolean> {
    try {
      this.logger.log(`[WHATSAPP-SIM] Sending Dispatch Notification for Order: ${orderId}. Vehicle: ${vehicle}, Driver: ${driver}. To: ${phoneNumber}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.logger.log(`[WHATSAPP-SIM] Dispatch Notification successfully sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`[WHATSAPP-SIM] Failed to send dispatch notification to ${phoneNumber}`, error);
      return false;
    }
  }
}
