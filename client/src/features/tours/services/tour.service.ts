import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Tour, TourFilters, ToursResponse, CreateTourInput, UpdateTourInput, MyToursParams } from '../types/tour.types';

interface GetToursParams extends TourFilters {
    page?: number;
    limit?: number;
}

class TourService {
    async getTours(params: GetToursParams = {}) {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ToursResponse;
        }>(API_ENDPOINTS.TOURS.LIST, { params });

        return response.data.data;
    }

    async getMyTours(params: MyToursParams = {}) {
        // Build query params explicitly to ensure proper serialization
        const queryParams: Record<string, string | number> = {};

        if (params.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params.limit !== undefined) {
            queryParams.limit = params.limit;
        }
        // Only send includeInactive when true (backend defaults to false)
        if (params.includeInactive === true) {
            queryParams.includeInactive = 'true';
        }

        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ToursResponse;
        }>(API_ENDPOINTS.TOURS.MY_TOURS, { params: queryParams });

        return response.data.data;
    }

    async updateTour(id: string, data: UpdateTourInput) {
        const response = await apiClient.patch<{
            success: boolean;
            message: string;
            data: Tour;
        }>(API_ENDPOINTS.TOURS.UPDATE(id), data);

        return response.data.data;
    }

    async deleteTour(id: string) {
        const response = await apiClient.delete<{
            success: boolean;
            message: string;
            data: Tour;
        }>(API_ENDPOINTS.TOURS.DELETE(id));

        return response.data;
    }

    async getTour(id: string) {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: Tour;
        }>(API_ENDPOINTS.TOURS.GET(id));

        return response.data.data;
    }
    async createTour(data: CreateTourInput) {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: Tour;
        }>(API_ENDPOINTS.TOURS.CREATE, data);

        return response.data;
    }

    async uploadTourImage(id: string, files: File | File[]) {
        const formData = new FormData();
        const fileList = Array.isArray(files) ? files : [files];

        fileList.forEach(file => {
            formData.append('file', file);
        });

        // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: any;
        }>(API_ENDPOINTS.TOURS.UPLOAD_IMAGE(id), formData);

        return response.data;
    }

    async getCompanyTours(companyId: string, params: { page?: number; limit?: number } = {}) {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: ToursResponse;
        }>(API_ENDPOINTS.COMPANIES.TOURS(companyId), { params });

        return response.data.data;
    }
}

export const tourService = new TourService();
