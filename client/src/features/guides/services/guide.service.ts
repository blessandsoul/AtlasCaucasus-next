import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Guide, GuideFilters, GuidePaginatedResponse, GuideMedia } from '../types/guide.types';

class GuideService {
  async getGuides(params: GuideFilters = {}): Promise<GuidePaginatedResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: GuidePaginatedResponse;
    }>(API_ENDPOINTS.GUIDES.LIST, { params });

    return response.data.data;
  }

  async getGuide(id: string): Promise<Guide> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Guide;
    }>(API_ENDPOINTS.GUIDES.GET(id));

    return response.data.data;
  }

  async getMyGuide(): Promise<Guide> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Guide;
    }>(API_ENDPOINTS.GUIDES.MY);

    return response.data.data;
  }

  async updateGuide(id: string, data: Partial<Guide>): Promise<Guide> {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: Guide;
    }>(API_ENDPOINTS.GUIDES.UPDATE(id), data);

    return response.data.data;
  }

  async deleteGuide(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GUIDES.DELETE(id));
  }

  // Photo management
  async getPhotos(id: string): Promise<GuideMedia[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: GuideMedia[];
    }>(API_ENDPOINTS.GUIDES.PHOTOS(id));

    return response.data.data;
  }

  async uploadPhotos(id: string, files: File | File[]): Promise<GuideMedia[]> {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];

    fileList.forEach((file) => {
      formData.append('file', file);
    });

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: GuideMedia[];
    }>(API_ENDPOINTS.GUIDES.PHOTOS(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async deletePhoto(id: string, photoId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GUIDES.DELETE_PHOTO(id, photoId));
  }

  // Avatar management (primary profile photo)
  async uploadAvatar(guideId: string, file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { avatarUrl: string };
    }>(API_ENDPOINTS.GUIDES.UPLOAD_AVATAR(guideId), formData);

    return response.data.data;
  }

  // Cover image management
  async uploadCover(guideId: string, file: File): Promise<{ coverUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { coverUrl: string };
    }>(API_ENDPOINTS.GUIDES.UPLOAD_COVER(guideId), formData);

    return response.data.data;
  }
}

export const guideService = new GuideService();
