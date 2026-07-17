import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, Outlet, Scheme, Distributor, Product } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';
import { DispatchService } from '../dispatch/dispatch.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Scheme') private schemeModel: Model<Scheme>,
    @InjectModel('Distributor') private distributorModel: Model<Distributor>,
    @InjectModel('Product') private productModel: Model<Product>,
    private inventoryService: InventoryService,
    private dispatchService: DispatchService,
  ) {}

  async findAll(organizationId: string): Promise<Order[]> {
    return this.orderModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, userId: string, orderData: Partial<Order>): Promise<Order> {
    if (!orderData.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    // 1. Idempotency Check (BR-019)
    const existingOrder = await this.orderModel.findOne({ 
      organizationId, 
      idempotencyKey: orderData.idempotencyKey 
    });

    if (existingOrder) {
      this.logger.log(`Idempotent return for order ${orderData.idempotencyKey}`);
      return existingOrder;
    }

    const outlet = await this.outletModel.findById(orderData.outletId);
    if (!outlet) {
      throw new BadRequestException('Outlet not found');
    }

    // 2. Fetch Product Master Data to validate prices and calculate exact GST
    const productIds = (orderData.items || []).map(i => i.productId);
    const products = await this.productModel.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 3. Determine Inter-state vs Intra-state (BR-004)
    let isInterState = false;
    if (orderData.assignedDistributorId) {
      const distributor = await this.distributorModel.findById(orderData.assignedDistributorId);
      if (distributor && distributor.location.state !== outlet.location.state) {
        isInterState = true;
      }
    }

    // 4. Validate Items (BR-022 Minimum Price & BR-004 GST Calculation)
    const items = (orderData.items || []).map(item => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (item.unitPrice < product.pricing.basePrice) {
        throw new BadRequestException(`Price violation for ${product.name}: Unit price cannot be below ${product.pricing.basePrice}`);
      }

      const baseSubTotal = item.unitPrice * item.quantity;
      const subTotal = baseSubTotal - (item.discount || 0);
      
      const gstRate = product.pricing.gstPercentage || 0;
      const gstAmount = parseFloat((subTotal * (gstRate / 100)).toFixed(2));
      
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      
      if (isInterState) {
        igstAmount = gstAmount;
      } else {
        // Round half up to avoid precision issues
        cgstAmount = parseFloat((gstAmount / 2).toFixed(2));
        sgstAmount = parseFloat((gstAmount / 2).toFixed(2));
      }

      return {
        ...item,
        sku: product.sku,
        name: product.name,
        discount: item.discount || 0,
        gstPercentage: gstRate,
        subTotal: parseFloat(subTotal.toFixed(2)),
        cgstAmount,
        sgstAmount,
        igstAmount,
        total: parseFloat((subTotal + cgstAmount + sgstAmount + igstAmount).toFixed(2)),
      };
    });

    const totals = {
      subTotal: parseFloat(items.reduce((sum, item) => sum + item.subTotal, 0).toFixed(2)),
      discountTotal: parseFloat(items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)),
      cgstTotal: parseFloat(items.reduce((sum, item) => sum + item.cgstAmount, 0).toFixed(2)),
      sgstTotal: parseFloat(items.reduce((sum, item) => sum + item.sgstAmount, 0).toFixed(2)),
      igstTotal: parseFloat(items.reduce((sum, item) => sum + item.igstAmount, 0).toFixed(2)),
      grandTotal: parseFloat(items.reduce((sum, item) => sum + item.total, 0).toFixed(2)),
    };

    // 5. Credit Exposure Calculation (BR-006)
    // Fetch all open orders to calculate unbilled exposure
    const openOrders = await this.orderModel.find({
      outletId: outlet._id,
      status: { $in: ['Pending', 'Submitted', 'Approved', 'Dispatched'] }
    });

    const unbilledOrderExposure = openOrders.reduce((sum, ord) => sum + ord.totals.grandTotal, 0);
    const projectedExposure = outlet.commercial.outstandingBalance + unbilledOrderExposure + totals.grandTotal;

    if (projectedExposure > outlet.commercial.creditLimit) {
      throw new BadRequestException(
        `Order exceeds outlet credit limit. Projected Exposure: ₹${projectedExposure}, Limit: ₹${outlet.commercial.creditLimit}`
      );
    }

    const newOrder = new this.orderModel({
      ...orderData,
      orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
      createdByUserId: userId,
      items,
      totals,
      organizationId,
      status: 'Submitted',
    });

    try {
      return await newOrder.save();
    } catch (error: any) {
      // Handle race condition on idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        this.logger.log(`Idempotent return (race condition) for order ${orderData.idempotencyKey}`);
        return this.orderModel.findOne({ organizationId, idempotencyKey: orderData.idempotencyKey }) as any;
      }
      throw error;
    }
  }

  async updateStatus(
    organizationId: string, 
    orderId: string, 
    status: Order['status'], 
    actorId: string, 
    reason?: string
  ): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId });
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      actorId,
      timestamp: new Date().toISOString(),
      reason
    });

    return await order.save() as any;
  }

  async approveOrder(organizationId: string, orderId: string, actorId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId });
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (order.status !== 'Submitted') {
      throw new BadRequestException(`Order cannot be approved from status ${order.status}`);
    }

    // Reserve stock for all items
    for (const item of order.items || []) {
      await this.inventoryService.reserveStock(organizationId, item.productId, item.quantity);
    }

    return this.updateStatus(organizationId, orderId, 'Approved', actorId, 'Approved by web dashboard');
  }

  async dispatchOrder(organizationId: string, orderId: string, actorId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId });
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (order.status !== 'Approved') {
      throw new BadRequestException(`Order cannot be dispatched from status ${order.status}`);
    }

    // Deduct stock for all items
    for (const item of order.items || []) {
      await this.inventoryService.deductStock(organizationId, item.productId, item.quantity);
    }

    // Create Dispatch record
    await this.dispatchService.createDispatchFromOrder(organizationId, orderId);

    return this.updateStatus(organizationId, orderId, 'Dispatched', actorId, 'Dispatched via operations');
  }
}
