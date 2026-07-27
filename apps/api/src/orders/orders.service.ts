import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Order, Outlet, Scheme, Distributor, Product } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { ApprovalsService } from '../approvals/approvals.service';

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
    private moduleRef: ModuleRef,
    private approvalsService: ApprovalsService,
    @InjectConnection() private connection: Connection,
  ) {}

  private get dispatchService(): DispatchService {
    return this.moduleRef.get(DispatchService, { strict: false });
  }

  async findAll(organizationId: string): Promise<Order[]> {
    return this.orderModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, userId: string, orderData: Partial<Order>): Promise<Order> {
    delete (orderData as any).organizationId;
    delete (orderData as any)._id;
    delete (orderData as any).createdAt;
    delete (orderData as any).updatedAt;
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
    const productIds = (orderData.items || []).map((i: any) => i.productId);
    const products = await this.productModel.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const schemeIds = (orderData.items || []).map((i: any) => i.appliedSchemeId).filter(Boolean);
    const schemes = await this.schemeModel.find({ _id: { $in: schemeIds } });
    const schemeMap = new Map(schemes.map(s => [s._id.toString(), s]));

    // 3. Determine Inter-state vs Intra-state (BR-004)
    let isInterState = false;
    if (orderData.assignedDistributorId) {
      const distributor = await this.distributorModel.findById(orderData.assignedDistributorId);
      if (distributor && distributor.location.state !== outlet.location.state) {
        isInterState = true;
      }
    }

    // 4. Validate Items (BR-022 Minimum Price, Scheme Validation & BR-004 GST Calculation)
    let requiresApproval = false;
    let approvalReason = '';

    const items = (orderData.items || []).map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // BR-022: Scheme validation (if applied)
      if (item.appliedSchemeId) {
        const scheme = schemeMap.get(item.appliedSchemeId);
        if (!scheme) {
          throw new BadRequestException(`Scheme ${item.appliedSchemeId} not found`);
        }
        if (!scheme.isActive) {
          throw new BadRequestException(`Scheme ${scheme.name} is not active`);
        }
        const now = new Date();
        if (now < new Date(scheme.validFrom) || now > new Date(scheme.validUntil)) {
          throw new BadRequestException(`Scheme ${scheme.name} is expired or not yet started`);
        }
      }

      // Trigger approval instead of throwing error if price is below minimum (BR-022)
      if (item.unitPrice < product.pricing.basePrice) {
        requiresApproval = true;
        approvalReason = `Unit price of ${product.name} is below minimum base price of ${product.pricing.basePrice}.`;
      }

      // Trigger approval if item quantity is less than Minimum Order Quantity (BR-023)
      if (item.quantity < (product.moq || 1)) {
        requiresApproval = true;
        approvalReason = `Quantity of ${product.name} (${item.quantity}) is below MOQ of ${product.moq || 1}.`;
      }

      const baseSubTotal = item.unitPrice * item.quantity;
      const subTotal = baseSubTotal - (item.discount || 0);
      
      const gstRate = product.pricing.gstPercentage || 0;
      const gstAmount = parseFloat((subTotal * (gstRate / 100)).toFixed(2));
      
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      
      if (isInterState) {
        igstAmount = gstAmount;
      } else {
        // Fix precision issues so cgst + sgst perfectly equals gstAmount
        cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
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
      subTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.subTotal, 0).toFixed(2)),
      discountTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.discount, 0).toFixed(2)),
      cgstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.cgstAmount, 0).toFixed(2)),
      sgstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.sgstAmount, 0).toFixed(2)),
      igstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.igstAmount, 0).toFixed(2)),
      grandTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.total, 0).toFixed(2)),
    };

    // 5. Credit Exposure Calculation (BR-006)
    // Fetch all open orders to calculate unbilled exposure
    const openOrders = await this.orderModel.find({
      outletId: outlet._id,
      status: { $in: ['Pending', 'Submitted', 'Approved', 'Dispatched'] }
    });

    const unbilledOrderExposure = openOrders.reduce((sum, ord) => sum + ord.totals.grandTotal, 0);
    const projectedExposure = outlet.commercial.outstandingBalance + unbilledOrderExposure + totals.grandTotal;

    let initialStatus = orderData.status || 'Submitted';
    
    // Draft orders skip credit and stock checks completely until submitted
    if (initialStatus === 'Draft') {
      this.logger.log(`Order saved as Draft for outlet ${outlet._id}`);
    } else {
      if (requiresApproval) {
      initialStatus = 'Pending_Approval';
      this.logger.warn(`Order placed on Pending_Approval. Reason: ${approvalReason}`);
    } else if (projectedExposure > outlet.commercial.creditLimit) {
      initialStatus = 'Hold_Credit';
      this.logger.warn(`Order placed on Hold_Credit. Projected Exposure: ₹${projectedExposure}, Limit: ₹${outlet.commercial.creditLimit}`);
    } else {
      // BR-016: If exposure is fine, check stock availability.
      let hasInsufficientStock = false;
      for (const item of items) {
        const isStockAvailable = await this.inventoryService.checkStockAvailable(organizationId, item.productId, item.quantity);
        if (!isStockAvailable) {
          hasInsufficientStock = true;
          break;
        }
      }
      if (hasInsufficientStock) {
        initialStatus = 'Hold_Stock';
        this.logger.warn(`Order placed on Hold_Stock due to insufficient inventory for one or more items.`);
      }
    }
    } // Missing brace added

    const newOrder = new this.orderModel({
      ...orderData,
      orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
      createdByUserId: userId,
      items,
      totals,
      organizationId,
      status: initialStatus,
    });

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const savedOrder = await newOrder.save({ session });

      if (initialStatus === 'Pending_Approval') {
        await this.approvalsService.createApproval(organizationId, {
          outlet: outlet.name,
          order: savedOrder.orderNumber,
          type: 'Price Override',
          reason: approvalReason,
          amount: totals.grandTotal,
          priority: 'High',
          requestedBy: userId
        });
      }

      await session.commitTransaction();
      return savedOrder;
    } catch (error: any) {
      await session.abortTransaction();
      // Handle race condition on idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        this.logger.log(`Idempotent return (race condition) for order ${orderData.idempotencyKey}`);
        return this.orderModel.findOne({ organizationId, idempotencyKey: orderData.idempotencyKey }) as any;
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStatus(
    organizationId: string, 
    orderId: string, 
    status: Order['status'], 
    actorId: string, 
    reason?: string,
    session?: any
  ): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Cancelled'],
      'Submitted': ['Pending_Approval', 'Hold_Credit', 'Hold_Stock', 'Approved', 'Rejected', 'Cancelled'],
      'Pending_Approval': ['Approved', 'Rejected', 'Cancelled'],
      'Hold_Credit': ['Approved', 'Rejected', 'Cancelled'],
      'Hold_Stock': ['Approved', 'Rejected', 'Cancelled'],
      'Approved': ['Allocated', 'Dispatched', 'Cancelled'],
      'Allocated': ['Dispatched', 'Cancelled'],
      'Dispatched': ['Delivered', 'Partial_Delivery', 'Damaged_Delivery', 'Cancelled'],
      'Delivered': ['Returned'],
      'Partial_Delivery': ['Returned'],
      'Damaged_Delivery': ['Returned'],
      'Returned': ['Closed'],
      'Rejected': [],
      'Cancelled': [],
      'Closed': []
    };

    if (validTransitions[order.status as string] && !validTransitions[order.status as string].includes(status as string)) {
      throw new BadRequestException(`Invalid order state transition from ${order.status} to ${status}`);
    }

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      actorId,
      timestamp: new Date().toISOString(),
      reason
    });

    return await order.save({ session }) as any;
  }

  async approveOrder(
    organizationId: string, 
    orderId: string, 
    actorId: string, 
    manualAllocations?: Record<string, { batch: string; quantity: number }[]>,
    reason?: string
  ): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (!['Submitted', 'Hold_Stock', 'Pending_Approval'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be approved from status ${order.status}`);
      }

      if (manualAllocations && !reason) {
        throw new BadRequestException('A reason is mandatory when providing manual batch overrides');
      }

      // Reserve stock for all items (FEFO) and capture batch allocations
      let hasInsufficientStock = false;
      for (const item of order.items || []) {
        try {
          const product = await this.productModel.findById(item.productId).session(session);
          const minShelfLife = product?.shelfLifeDays ? Math.floor(product.shelfLifeDays * 0.2) : 0; // Require at least 20% shelf life remaining

          const itemManualAllocations = manualAllocations ? manualAllocations[item.productId] : undefined;
          const allocations = await this.inventoryService.reserveStock(
            organizationId, 
            item.productId, 
            item.quantity, 
            undefined, 
            session,
            itemManualAllocations,
            minShelfLife
          );
          item.allocations = allocations;
          console.log('ALLOCATIONS FROM INVENTORY:', allocations);
          console.log('ORDER ITEM NOW HAS ALLOCATIONS:', item.allocations);
        } catch (error: any) {
          if (error.message.includes('Insufficient stock')) {
            hasInsufficientStock = true;
          } else {
            throw error;
          }
        }
      }

      if (hasInsufficientStock) {
        order.status = 'Hold_Stock' as any;
        order.markModified('items');
        await order.save({ session });
        await this.updateStatus(organizationId, orderId, 'Hold_Stock', actorId, 'Insufficient stock during approval attempt', session);
        await session.commitTransaction();
        return order as any;
      }

      order.markModified('items');
      await order.save({ session });
      const updated = await this.updateStatus(organizationId, orderId, 'Approved', actorId, reason || 'Approved by web dashboard', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async dispatchOrder(organizationId: string, orderId: string, actorId: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (order.status !== 'Approved') {
        throw new BadRequestException(`Order cannot be dispatched from status ${order.status}`);
      }

      // Deduct stock for all items using specific batch allocations
      for (const item of order.items || []) {
        await this.inventoryService.deductStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
      }

      // Create Dispatch record (Dispatch service doesn't use session currently, but should ideally)
      await this.dispatchService.createDispatchFromOrder(organizationId, orderId, undefined, undefined, session);

      const updated = await this.updateStatus(organizationId, orderId, 'Dispatched', actorId, 'Dispatched via operations', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findById(organizationId: string, orderId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId }).exec();
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }
    return order as any;
  }

  async rejectOrder(organizationId: string, orderId: string, actorId: string, reason?: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (['Dispatched', 'Delivered', 'Cancelled', 'Rejected'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be rejected from status ${order.status}`);
      }

      // Release stock if it was approved, using specific batch allocations
      if (order.status === 'Approved') {
        for (const item of order.items || []) {
          await this.inventoryService.releaseReservedStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
        }
      }

      const updated = await this.updateStatus(organizationId, orderId, 'Rejected', actorId, reason || 'Rejected by manager', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelOrder(organizationId: string, orderId: string, actorId: string, reason?: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (['Dispatched', 'Delivered', 'Cancelled', 'Rejected'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be cancelled from status ${order.status}`);
      }

      // Release stock if it was approved, using specific batch allocations
      if (order.status === 'Approved') {
        for (const item of order.items || []) {
          await this.inventoryService.releaseReservedStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
        }
      }

      const updated = await this.updateStatus(organizationId, orderId, 'Cancelled', actorId, reason || 'Cancelled by user', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async syncOfflineOrders(organizationId: string, userId: string, ordersData: Partial<Order>[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const orderData of ordersData) {
      try {
        await this.create(organizationId, userId, orderData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ idempotencyKey: orderData.idempotencyKey, error: error.message });
      }
    }

    return results;
  }
}
