import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Invoice, PaymentCollection, Outlet, Order } from '@bharatsales/shared-types';
import { TallyAdapter } from '../integrations/adapters/tally.adapter';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectModel('Invoice') private invoiceModel: Model<Invoice>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectConnection() private connection: Connection,
    private tallyAdapter: TallyAdapter,
  ) {}

  async getInvoices(organizationId: string): Promise<Invoice[]> {
    return this.invoiceModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async getCollections(organizationId: string): Promise<PaymentCollection[]> {
    return this.collectionModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async generateInvoiceFromOrder(organizationId: string, orderId: string, session?: any, deliveredItems?: { productId: string, deliveredQty: number }[]): Promise<Invoice> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId }).session(session);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const existingInvoice = await this.invoiceModel.findOne({ orderId, organizationId }).session(session);
    if (existingInvoice) {
      throw new BadRequestException('Invoice already generated for this order');
    }

    let invoiceTotal = order.totals.grandTotal;

    if (deliveredItems && deliveredItems.length > 0) {
      invoiceTotal = 0;
      for (const item of order.items) {
        const delivered = deliveredItems.find(d => d.productId === item.productId);
        if (delivered) {
          const discountPerUnit = (item.discount || 0) / item.quantity;
          const adjustedSubTotal = (item.unitPrice * delivered.deliveredQty) - (discountPerUnit * delivered.deliveredQty);
          const adjustedCgst = adjustedSubTotal * (item.gstPercentage / 2) / 100;
          const adjustedSgst = adjustedCgst;
          const adjustedTotal = adjustedSubTotal + adjustedCgst + adjustedSgst;
          invoiceTotal += adjustedTotal;
        }
      }
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Net 15

    const invoice = new this.invoiceModel({
      organizationId,
      invoiceNumber: `INV-${Date.now()}`,
      orderId: order._id,
      outletId: order.outletId,
      totalAmount: invoiceTotal,
      paidAmount: 0,
      status: 'Unpaid',
      dueDate: dueDate.toISOString(),
    });

    const savedInvoice = await invoice.save({ session }) as any;

    // Update Outlet's outstanding balance
    await this.outletModel.updateOne(
      { _id: order.outletId, organizationId },
      { $inc: { 'commercial.outstandingBalance': invoiceTotal } },
      { session }
    );

    // Export to Tally (Fire and Forget)
    const outlet = await this.outletModel.findById(order.outletId).session(session);
    if (outlet) {
      this.tallyAdapter.exportInvoiceToTally(savedInvoice, outlet.name).catch(err => {
        this.logger.error('Failed to sync to Tally', err);
      });
    }

    return savedInvoice;
  }

  async recordCollection(organizationId: string, userId: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const outlet = await this.outletModel.findById(data.outletId).session(session);
      if (!outlet) {
        throw new NotFoundException('Outlet not found');
      }

      if (data.paymentMode !== 'Cash' && data.referenceNumber) {
        const duplicate = await this.collectionModel.findOne({
          organizationId,
          referenceNumber: data.referenceNumber,
        }).session(session);

        if (duplicate) {
          throw new BadRequestException(`Duplicate payment reference detected: ${data.referenceNumber}`);
        }
      }

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

      await collection.save({ session });

      if (data.invoiceId) {
        const invoice = await this.invoiceModel.findOne({ _id: data.invoiceId, organizationId, outletId: data.outletId }).session(session);
        if (!invoice) {
          throw new BadRequestException('Invoice not found or does not belong to the specified outlet');
        }

        const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
        if ((data.amount || 0) > remainingAmount) {
          throw new BadRequestException(`Collection amount (${data.amount}) exceeds the remaining invoice balance (${remainingAmount})`);
        }

        invoice.paidAmount = (invoice.paidAmount || 0) + (data.amount || 0);
        if (invoice.paidAmount >= invoice.totalAmount) {
          invoice.status = 'Paid';
        } else if (invoice.paidAmount > 0) {
          invoice.status = 'Partial';
        }
        await invoice.save({ session });
      }

      if (status === 'Cleared') {
        outlet.commercial.outstandingBalance = Math.max(0, outlet.commercial.outstandingBalance - (data.amount || 0));
        await outlet.save({ session });
      }

      await session.commitTransaction();
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async reverseCollection(organizationId: string, collectionId: string, userId: string): Promise<PaymentCollection> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const original = await this.collectionModel.findOne({ _id: collectionId, organizationId }).session(session);
      if (!original) {
        throw new NotFoundException('Collection not found');
      }

      if (original.status === 'Bounced' || original.amount < 0) {
        throw new BadRequestException('Collection is already reversed or is a reversal entry itself');
      }

      original.status = 'Bounced';
      await original.save({ session });

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
      
      await reversal.save({ session });

      const outlet = await this.outletModel.findById(original.outletId).session(session);
      if (outlet) {
        outlet.commercial.outstandingBalance += original.amount;
        await outlet.save({ session });
      }

      if (original.invoiceId) {
        const invoice = await this.invoiceModel.findById(original.invoiceId).session(session);
        if (invoice) {
          invoice.paidAmount -= original.amount;
          if (invoice.paidAmount <= 0) {
            invoice.paidAmount = 0;
            invoice.status = 'Unpaid';
          } else {
            invoice.status = 'Partial';
          }
          await invoice.save({ session });
        }
      }

      await session.commitTransaction();
      return reversal;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getLedger(organizationId: string, outletId: string): Promise<any[]> {
    const invoices = await this.invoiceModel.find({ organizationId, outletId }).exec();
    const collections = await this.collectionModel.find({ organizationId, outletId }).exec();

    let ledger = [];

    for (const inv of invoices) {
      ledger.push({
        id: inv._id.toString(),
        date: inv.createdAt,
        type: 'Invoice',
        reference: inv.invoiceNumber,
        debit: inv.totalAmount,
        credit: 0,
        status: inv.status
      });
    }

    for (const col of collections) {
      if (col.status === 'Cleared' || col.status === 'Bounced') {
        ledger.push({
          id: col._id.toString(),
          date: col.collectionDate || col.createdAt,
          type: col.amount < 0 ? 'Reversal' : (col.status === 'Bounced' ? 'Bounced' : 'Collection'),
          reference: col.receiptNumber,
          debit: col.amount < 0 ? Math.abs(col.amount) : 0,
          credit: col.amount > 0 && col.status !== 'Bounced' ? col.amount : 0,
          status: col.status
        });
      }
    }

    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    for (let entry of ledger) {
      runningBalance += entry.debit;
      runningBalance -= entry.credit;
      (entry as any).runningBalance = runningBalance;
    }

    return ledger.reverse(); // Newest first for UI
  }
}
