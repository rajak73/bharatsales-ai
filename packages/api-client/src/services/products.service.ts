import type { Product } from '@bharatsales/shared-types';
import { apiClient } from '../index';

export class ProductsService {
  static async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  }

  static async createProduct(data: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  }
}
