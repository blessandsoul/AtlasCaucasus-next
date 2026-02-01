import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type { Media, MediaEntityType, BatchUploadResult } from '../types/media.types';

class MediaService {
  async getMedia(entityType: MediaEntityType, entityId: string): Promise<Media[]> {
    const response = await apiClient.get<ApiResponse<Media[]>>(
      API_ENDPOINTS.MEDIA.GET(entityType, entityId)
    );
    return response.data.data;
  }

  async uploadMedia(
    entityType: MediaEntityType,
    entityId: string,
    file: File
  ): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<Media>>(
      API_ENDPOINTS.MEDIA.UPLOAD(entityType, entityId),
      formData
    );
    return response.data.data;
  }

  async batchUpload(
    entityType: MediaEntityType,
    entityId: string,
    files: File[]
  ): Promise<BatchUploadResult> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<ApiResponse<BatchUploadResult>>(
      API_ENDPOINTS.MEDIA.BATCH_UPLOAD(entityType, entityId),
      formData
    );
    return response.data.data;
  }

  async deleteMedia(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.MEDIA.DELETE(id));
  }
}

export const mediaService = new MediaService();
