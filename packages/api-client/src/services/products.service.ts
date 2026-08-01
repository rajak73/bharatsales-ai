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

  static async getCatalog(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products/catalog');
    return response.data;
  }

  static async getProductForOutlet(id: string, outletId: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}/outlet/${outletId}`);
    return response.data;
  }

  static async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  static async deleteProduct(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/products/${id}`);
    return response.data;
  }
}
