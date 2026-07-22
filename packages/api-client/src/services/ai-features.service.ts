import { apiClient } from '../index';
import type { AiInsights } from '@bharatsales/shared-types';

export class AiFeaturesService {
  static async getInsights(): Promise<AiInsights> {
    const response = await apiClient.get<AiInsights>(`/ai-features/insights`);
    return response.data;
  }

  static async getRecommendations(outletId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/ai-features/recommendations/${outletId}`);
    return response.data;
  }

  static async parseVoice(transcription: string): Promise<any[]> {
    const response = await apiClient.post<{items: any[]}>(`/ai-features/parse-voice`, { transcription });
    return response.data.items;
  }
}
