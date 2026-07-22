import { apiClient } from '../index';
import type { Expense } from '@bharatsales/shared-types';

export class ExpensesService {
  static async getExpenses(): Promise<Expense[]> {
    const response = await apiClient.get<Expense[]>('/expenses');
    return response.data;
  }

  static async updateExpenseStatus(id: string, status: 'Approved' | 'Rejected'): Promise<Expense> {
    const response = await apiClient.patch<Expense>(`/expenses/${id}/status`, { status });
    return response.data;
  }
}
