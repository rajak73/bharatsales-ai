import { apiClient } from '../index';

export const UploadsService = {
  uploadVisitPhoto: async (blob: Blob, filename: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('photo', blob, filename);
    const response = await apiClient.post('/uploads/visit-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
