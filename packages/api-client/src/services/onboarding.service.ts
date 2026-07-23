import { apiClient } from '../index';

export class OnboardingService {
  static async getState() {
    const response = await apiClient.get('/onboarding');
    return response.data;
  }

  static async saveStep(stepNumber: number, stepData: any) {
    const response = await apiClient.put(`/onboarding/step/${stepNumber}`, stepData);
    return response.data;
  }

  static async completeOnboarding() {
    const response = await apiClient.post('/onboarding/complete');
    return response.data;
  }
}
