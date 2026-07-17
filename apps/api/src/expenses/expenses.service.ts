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
}
