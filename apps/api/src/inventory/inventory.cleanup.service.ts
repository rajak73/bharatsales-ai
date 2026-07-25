import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryCleanupService {
  private readonly logger = new Logger(InventoryCleanupService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly inventoryService: InventoryService,
  ) {}

  // Run every 15 minutes to check for expired holds
  @Cron('*/15 * * * *')
  async handleCron() {
    this.logger.debug('Running expired inventory hold cleanup...');

    // Find orders in Hold_Stock or Pending_Approval that are older than 24 hours
    const expirationThreshold = new Date();
    expirationThreshold.setHours(expirationThreshold.getHours() - 24);

    const expiredOrders = await this.orderModel.find({
      status: { $in: ['Hold_Stock', 'Pending_Approval'] },
      createdAt: { $lt: expirationThreshold.toISOString() },
    }).exec();

    if (expiredOrders.length === 0) {
      this.logger.debug('No expired inventory holds found.');
      return;
    }

    this.logger.log(`Found ${expiredOrders.length} expired orders holding stock. Releasing...`);

    for (const order of expiredOrders) {
      try {
        for (const item of order.items || []) {
          if (item.allocations && item.allocations.length > 0) {
            await this.inventoryService.releaseReservedStock(
              order.organizationId,
              item.productId,
              item.quantity,
              undefined,
              undefined,
              item.allocations
            );
          }
        }
        
        // Update order status so it doesn't get picked up again
        order.status = 'Cancelled';
        await order.save();
        
        this.logger.log(`Successfully released stock and cancelled order ${order._id}`);
      } catch (error: any) {
        this.logger.error(`Failed to release stock for order ${order._id}: ${error.message}`);
      }
    }
  }
}
