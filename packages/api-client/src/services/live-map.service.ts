import { apiClient } from '../index';
import type { LiveRep } from '@bharatsales/shared-types';

export class LiveMapService {
  static async getLiveReps(): Promise<LiveRep[]> {
    const response = await apiClient.get<LiveRep[]>('/live-map/reps');
    return response.data;
  }
}
