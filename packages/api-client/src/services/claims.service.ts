import { apiClient } from '../index';
import { Claim, ClaimStatus } from '@bharatsales/shared-types';

export class ClaimsService {
  static async getClaims(): Promise<Claim[]> {
    const response = await apiClient.get('/claims');
    return response.data;
  }

  static async getClaimById(id: string): Promise<Claim> {
    const response = await apiClient.get(`/claims/${id}`);
    return response.data;
  }

  static async createClaim(data: Partial<Claim>): Promise<Claim> {
    const response = await apiClient.post('/claims', data);
    return response.data;
  }

  static async approveClaim(id: string, reason?: string): Promise<Claim> {
    const response = await apiClient.post(`/claims/${id}/approve`, { reason });
    return response.data;
  }

  static async rejectClaim(id: string, reason?: string): Promise<Claim> {
    const response = await apiClient.post(`/claims/${id}/reject`, { reason });
    return response.data;
  }
}
