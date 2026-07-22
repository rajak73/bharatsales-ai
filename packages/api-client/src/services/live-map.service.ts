import { apiClient } from '../index';
import type { LiveRep } from '@bharatsales/shared-types';

export class LiveMapService {
  static async getLiveReps(): Promise<LiveRep[]> {
    const response = await apiClient.get<LiveRep[]>('/live-map/reps');
    return response.data;
  }

  static getLiveRepsStreamUrl(organizationId: string): string {
    return `${apiClient.defaults.baseURL || 'http://localhost:3001'}/live-map/stream?organizationId=${organizationId}`;
  }
}
