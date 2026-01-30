import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Driver, DriverFilters, DriverPaginatedResponse, DriverMedia } from '../types/driver.types';

class DriverService {
  async getDrivers(params: DriverFilters = {}): Promise<DriverPaginatedResponse> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: DriverPaginatedResponse;
    }>(API_ENDPOINTS.DRIVERS.LIST, { params });

    return response.data.data;
  }

  async getDriver(id: string): Promise<Driver> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Driver;
    }>(API_ENDPOINTS.DRIVERS.GET(id));

    return response.data.data;
  }

  async getMyDriver(): Promise<Driver> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Driver;
    }>(API_ENDPOINTS.DRIVERS.MY);

    return response.data.data;
  }

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: Driver;
    }>(API_ENDPOINTS.DRIVERS.UPDATE(id), data);

    return response.data.data;
  }

  async deleteDriver(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DRIVERS.DELETE(id));
  }

  // Photo management
  async getPhotos(id: string): Promise<DriverMedia[]> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: DriverMedia[];
    }>(API_ENDPOINTS.DRIVERS.PHOTOS(id));

    return response.data.data;
  }

  async uploadPhotos(id: string, files: File | File[]): Promise<DriverMedia[]> {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];

    fileList.forEach((file) => {
      formData.append('file', file);
    });

    // Don't set Content-Type manually - axios will set it automatically with the boundary
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: DriverMedia[];
    }>(API_ENDPOINTS.DRIVERS.PHOTOS(id), formData);

    return response.data.data;
  }

  async deletePhoto(id: string, photoId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DRIVERS.DELETE_PHOTO(id, photoId));
  }
}

export const driverService = new DriverService();
