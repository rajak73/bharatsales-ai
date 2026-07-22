import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from '../schemas';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel('Expense') private readonly expenseModel: Model<Expense>,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<Expense[]> {
    return this.expenseModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async updateStatus(organizationId: string, id: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<Expense> {
    const expense = await this.expenseModel.findOneAndUpdate(
      { _id: id, organizationId },
      { status },
      { new: true }
    ).exec();

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async create(organizationId: string, data: any): Promise<Expense> {
    delete data.organizationId;
    delete data._id;
    const newExpense = new this.expenseModel({ ...data, organizationId });
    return newExpense.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Expense> {
    delete data.organizationId;
    delete data._id;
    const expense = await this.expenseModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const expense = await this.expenseModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!expense) throw new NotFoundException('Expense not found');
    return { deleted: true };
  }
}
