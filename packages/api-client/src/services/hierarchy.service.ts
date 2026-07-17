import { apiClient } from '../index';
import type { HierarchyNode } from '@bharatsales/shared-types';

export class HierarchyService {
  static async getHierarchyNodes(): Promise<HierarchyNode[]> {
    const response = await apiClient.get<HierarchyNode[]>('/hierarchy');
    return response.data;
  }

  static async createNode(nodeData: Partial<HierarchyNode>): Promise<HierarchyNode> {
    const response = await apiClient.post<HierarchyNode>('/hierarchy', nodeData);
    return response.data;
  }

  static async updateNode(id: string, updateData: Partial<HierarchyNode>): Promise<HierarchyNode> {
    const response = await apiClient.put<HierarchyNode>(`/hierarchy/${id}`, updateData);
    return response.data;
  }

  static async deleteNode(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/hierarchy/${id}`);
    return response.data;
  }
}
