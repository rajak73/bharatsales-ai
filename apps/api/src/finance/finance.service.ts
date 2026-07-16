import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, PaymentCollection, Outlet, Order } from '@bharatsales/shared-types';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectModel('Invoice') private invoiceModel: Model<Invoice>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Order') private orderModel: Model<Order>,
  ) {}

  async getInvoices(organizationId: string): Promise<Invoice[]> {
    return this.invoiceModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async getCollections(organizationId: string): Promise<PaymentCollection[]> {
    return this.collectionModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async generateInvoiceFromOrder(organizationId: string, orderId: string): Promise<Invoice> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const existingInvoice = await this.invoiceModel.findOne({ orderId, organizationId });
    if (existingInvoice) {
      throw new BadRequestException('Invoice already generated for this order');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Net 15

    const invoice = new this.invoiceModel({
      organizationId,
      invoiceNumber: `INV-${Date.now()}`, // simple generation strategy
      orderId: order._id,
      outletId: order.outletId,
      totalAmount: order.totals.grandTotal,
      paidAmount: 0,
      status: 'Unpaid',
      dueDate: dueDate.toISOString(),
    });

    return invoice.save() as any;
  }

  async recordCollection(organizationId: string, userId: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const outlet = await this.outletModel.findById(data.outletId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    // BR-020: Duplicate Payment Detection
    if (data.paymentMode !== 'Cash' && data.referenceNumber) {
      const duplicate = await this.collectionModel.findOne({
        organizationId,
        referenceNumber: data.referenceNumber,
      });

      if (duplicate) {
        throw new BadRequestException(`Duplicate payment reference detected: ${data.referenceNumber}`);
      }
    }

    // Default status logic based on mode
    let status = data.status || 'Cleared';
    if (['Cheque', 'Bank Transfer'].includes(data.paymentMode as string) && !data.status) {
      status = 'Pending';
    }

    const collection = new this.collectionModel({
      ...data,
      organizationId,
      collectedByUserId: userId,
      status
    });

    await collection.save();

    // 1. Update Invoice if linked
    if (data.invoiceId) {
      const invoice = await this.invoiceModel.findById(data.invoiceId);
      if (invoice) {
        invoice.paidAmount += data.amount || 0;
        if (invoice.paidAmount >= invoice.totalAmount) {
          invoice.status = 'Paid';
        } else if (invoice.paidAmount > 0) {
          invoice.status = 'Partial';
        }
        await invoice.save();
      }
    }

    // 2. Reduce Outlet's outstanding balance if Cleared
    if (status === 'Cleared') {
      outlet.commercial.outstandingBalance = Math.max(0, outlet.commercial.outstandingBalance - (data.amount || 0));
      await outlet.save();
    }

    return collection;
  }

  async reverseCollection(organizationId: string, collectionId: string, userId: string): Promise<PaymentCollection> {
    const original = await this.collectionModel.findOne({ _id: collectionId, organizationId });
    if (!original) {
      throw new NotFoundException('Collection not found');
    }

    if (original.status === 'Bounced' || original.amount < 0) {
      throw new BadRequestException('Collection is already reversed or is a reversal entry itself');
    }

    // 1. Mark original as Bounced
    original.status = 'Bounced';
    await original.save();

    // 2. Create Reversal Compensating Entry (BR-011)
    const reversal = new this.collectionModel({
      organizationId,
      receiptNumber: `REV-${original.receiptNumber}`,
      invoiceId: original.invoiceId,
      outletId: original.outletId,
      collectedByUserId: userId,
      amount: -original.amount,
      paymentMode: original.paymentMode,
      referenceNumber: `REV-${original.referenceNumber || Date.now()}`,
      status: 'Cleared',
      collectionDate: new Date().toISOString()
    });
    
    await reversal.save();

    // 3. Restore Outlet's outstanding balance
    const outlet = await this.outletModel.findById(original.outletId);
    if (outlet) {
      outlet.commercial.outstandingBalance += original.amount;
      await outlet.save();
    }

    // 4. Reverse invoice paid amount if linked
    if (original.invoiceId) {
      const invoice = await this.invoiceModel.findById(original.invoiceId);
      if (invoice) {
        invoice.paidAmount -= original.amount;
        if (invoice.paidAmount <= 0) {
          invoice.paidAmount = 0;
          invoice.status = 'Unpaid';
        } else {
          invoice.status = 'Partial';
        }
        await invoice.save();
      }
    }

    return reversal;
  }
}
