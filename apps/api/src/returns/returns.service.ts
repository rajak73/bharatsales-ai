import { BadRequestException, NotFoundException, ForbiddenException } from '../core/http-errors';
import { Logger } from '../core/logger';
import { Model } from 'mongoose';
import { ReturnOrder } from '../schemas/return.schema';
import { ReturnOrder as SharedReturnOrder, Outlet, Invoice } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { asId } from '../core/query-safety';

// Coerce request values to primitives before they reach a Mongoose filter or
// update, so a request body can never inject a Mongo operator object.
function sanitizeItems(items: any): { product: string; qty: number }[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.map((item: any) => ({ product: String(item?.product), qty: Number(item?.qty) }));
}

/** $set document for PUT /returns/:id built from an allow-list of fields. */
function returnUpdate(data: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!data || typeof data !== 'object') return out;
  if (data.orderId !== undefined) out.orderId = data.orderId === null ? null : String(data.orderId);
  if (data.outlet !== undefined) out.outlet = String(data.outlet);
  if (data.reason !== undefined) out.reason = data.reason === null ? null : String(data.reason);
  if (data.items !== undefined) out.items = sanitizeItems(data.items) ?? [];
  if (data.value !== undefined) out.value = String(data.value);
  return out;
}

export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private returnModel: Model<ReturnOrder>,
    private outletModel: Model<Outlet>,
    private invoiceModel: Model<Invoice>,
    private orderModel: Model<any>,
    private productModel: Model<any>,
    private inventoryService: InventoryService,
    private financeService: FinanceService,
    private hierarchyService: HierarchyService
  ) {}

  async getReturns(organizationId: string, user?: any): Promise<ReturnOrder[]> {
    this.logger.log(`Fetching returns for org ${organizationId}`);
    const query: any = { organizationId };

    if (user && user.role === 'Distributor') {
      // Distributors have no territories: they see exactly the returns
      // assertCanActOnReturn lets them act on — tied to an order routed to
      // them, or (no order) to an outlet assigned to them.
      if (!user.distributorId) return [];
      const distributorId = String(user.distributorId);
      const [orders, outlets] = await Promise.all([
        this.orderModel.find({ organizationId, assignedDistributorId: distributorId }).select('_id').exec(),
        this.outletModel.find({ organizationId, 'commercial.assignedDistributorId': distributorId }).select('_id').exec(),
      ]);
      query.$or = [
        { orderId: { $in: orders.map((o: any) => o._id.toString()) } },
        { orderId: { $in: [null, ''] }, outlet: { $in: outlets.map((o: any) => o._id.toString()) } },
      ];
    } else if (user && !['Super Admin', 'Organization Admin'].includes(user.role)) {
      if (!user.territoryIds || user.territoryIds.length === 0) {
        return [];
      }
      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, user.territoryIds);
      const accessibleOutlets = await this.outletModel.find({
        organizationId,
        territoryId: { $in: descendantIds }
      }).select('_id').exec();
      const accessibleOutletIds = accessibleOutlets.map(o => o._id.toString());
      query.outlet = { $in: accessibleOutletIds };
    }

    return this.returnModel.find(query).exec();
  }

  /** Server-side refund value: original order unit price, else product base price. */
  private async calculateRefundValue(organizationId: string, orderId: string | undefined, items: any[] | undefined): Promise<number> {
    let calculatedRefundAmount = 0;

    if (orderId) {
      const order = await this.orderModel.findOne({ _id: String(orderId), organizationId });
      if (order && items) {
        for (const returnItem of items) {
          const originalItem = order.items.find((i: any) => i.productId === returnItem.product || i.productId?.toString() === returnItem.product);
          if (originalItem) {
            calculatedRefundAmount += (originalItem.unitPrice * returnItem.qty);
          } else {
             // Fallback to fetch product
            const product = await this.productModel.findOne({ _id: asId(returnItem.product), organizationId });
            if (product) {
              calculatedRefundAmount += (product.pricing.basePrice * returnItem.qty);
            }
          }
        }
      }
    } else if (items) {
        for (const returnItem of items) {
            const product = await this.productModel.findOne({ _id: asId(returnItem.product), organizationId });
            if (product) {
              calculatedRefundAmount += (product.pricing.basePrice * returnItem.qty);
            }
        }
    }

    return calculatedRefundAmount;
  }

  /**
   * A Distributor may only act on returns tied to them: through the order's
   * assignedDistributorId, or (no order) the outlet's assigned distributor.
   */
  async assertCanActOnReturn(organizationId: string, id: string, user?: any): Promise<void> {
    if (!user || user.role !== 'Distributor') return;
    const returnOrder: any = await this.returnModel.findOne({ _id: id, organizationId }).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    let owner: string | undefined;
    if (returnOrder.orderId) {
      const order: any = await this.orderModel.findOne({ _id: returnOrder.orderId, organizationId }).exec();
      owner = order?.assignedDistributorId?.toString();
    } else {
      const outlet: any = await this.outletModel.findOne({ _id: returnOrder.outlet, organizationId }).exec();
      owner = outlet?.commercial?.assignedDistributorId?.toString();
    }
    if (!user.distributorId || owner !== user.distributorId) {
      throw new ForbiddenException('This return is not assigned to you');
    }
  }

  async create(
    organizationId: string, 
    data: Omit<SharedReturnOrder, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
    userId: string
  ): Promise<ReturnOrder> {
    const outlet = await this.outletModel.findOne({ _id: asId(data.outlet), organizationId });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const calculatedRefundAmount = await this.calculateRefundValue(organizationId, data.orderId, data.items);

    // Override insecure client-provided value with secure backend calculation
    data.value = calculatedRefundAmount.toString();

    const status = data.status || 'Draft';
    if (!['Draft', 'Submitted'].includes(status)) {
      throw new BadRequestException('Initial status must be Draft or Submitted');
    }

    const newReturn = new this.returnModel({
      ...data,
      organizationId,
      status
    });

    await newReturn.save();
    return newReturn;
  }

  async updateStatus(
    organizationId: string, 
    id: string, 
    status: string, 
    userId: string, 
    reason?: string,
    restockClassification?: 'saleable' | 'damaged' | 'quarantine' | 'expired' | 'return-to-vendor',
    session?: any
  ): Promise<ReturnOrder> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).session(session).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');

    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Cancelled'],
      'Submitted': ['Pending_Approval', 'Rejected', 'Cancelled'],
      'Pending_Approval': ['Approved', 'Rejected'],
      'Approved': ['Received', 'Cancelled'],
      'Received': ['Inspected'],
      'Inspected': ['Closed'],
      'Rejected': [],
      'Closed': [],
      'Cancelled': []
    };

    if (validTransitions[returnOrder.status] && !validTransitions[returnOrder.status].includes(status)) {
      throw new BadRequestException(`Invalid return state transition from ${returnOrder.status} to ${status}`);
    }

    const previousStatus = returnOrder.status;
    returnOrder.status = status as any;
    
    // On financial approval/received
    if (status === 'Approved' || status === 'Received') {
      const refundAmount = Number(returnOrder.value) || 0;
      if (refundAmount > 0 && status === 'Approved') {
        await this.financeService.createCreditNote(organizationId, returnOrder.outlet, refundAmount, returnOrder._id.toString(), session);
      }
    }

    if (status === 'Inspected' || status === 'Closed') {
      if (previousStatus !== 'Inspected' && previousStatus !== 'Closed') {
        if (returnOrder.items && returnOrder.items.length > 0) {
        for (const item of returnOrder.items) {
          let batchName = `RETURN-${id}`;
          if (restockClassification === 'damaged') batchName = `DAMAGED-${id}`;
          if (restockClassification === 'quarantine') batchName = `QUARANTINE-${id}`;
          if (restockClassification === 'expired') batchName = `EXPIRED-${id}`;
          if (restockClassification === 'return-to-vendor') batchName = `RTV-${id}`;
          
          let status = 'Active';
          let blocked = false;
          if (restockClassification && restockClassification !== 'saleable') {
             status = 'Quarantine';
             blocked = true;
          }

          await this.inventoryService.adjustStock(organizationId, {
            productId: item.product,
            batch: batchName,
            type: 'Transfer In', // Or 'Purchase Return' / 'Customer Return'
            quantity: item.qty,
            reason: `Return Order ${id} inspected as ${restockClassification || 'saleable'}`,
            status,
            blocked
          }, session);
        }
      }
    }
    }

    return await returnOrder.save({ session });
  }

  async approveReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    return this.updateStatus(organizationId, id, 'Approved', userId, 'Approved by admin', undefined, session);
  }

  async rejectReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    return this.updateStatus(organizationId, id, 'Rejected', userId, 'Rejected by admin', undefined, session);
  }

  async update(organizationId: string, id: string, data: Partial<SharedReturnOrder>): Promise<ReturnOrder> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    const existing: any = await this.returnModel.findOne({ _id: id, organizationId }).exec();
    if (!existing) throw new NotFoundException('Return order not found');
    // Once a return is past Submitted, its items/order drive credit notes and
    // restocking, so it can no longer be edited.
    if (!['Draft', 'Submitted'].includes(existing.status)) {
      throw new BadRequestException(`A return in status ${existing.status} can no longer be edited`);
    }
    // Keep value consistent with whatever items/order the return now has.
    if (data.items !== undefined || data.orderId !== undefined) {
      const orderId = data.orderId !== undefined ? data.orderId : existing.orderId;
      const items = data.items !== undefined ? data.items : existing.items;
      (data as any).value = (await this.calculateRefundValue(organizationId, orderId, items)).toString();
    }
    const returnOrder = await this.returnModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: returnUpdate(data) },
      { new: true }
    ).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    return returnOrder;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    
    if (['Approved', 'Received', 'Inspected', 'Closed'].includes(returnOrder.status)) {
      throw new BadRequestException('Cannot hard delete an approved or closed return. Please cancel it instead.');
    }
    
    await this.returnModel.findOneAndDelete({ _id: id, organizationId }).exec();
    return { deleted: true };
  }

  async createReturnFromShortDelivery(
    organizationId: string,
    orderId: string,
    outletId: string,
    shortItems: { productId: string, shortQty: number }[],
    session?: any
  ): Promise<ReturnOrder> {
    if (!shortItems || shortItems.length === 0) return null as any;

    const newReturn = new this.returnModel({
      organizationId,
      orderId,
      outlet: outletId,
      reason: 'Auto-generated from Short/Damaged Delivery',
      value: '0',
      status: 'Submitted', // Immediately submitted
      items: shortItems.map(item => ({ product: item.productId, qty: item.shortQty }))
    });

    return newReturn.save({ session });
  }
}
