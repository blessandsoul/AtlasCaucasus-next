import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Location, LocationFilters, LocationsResponse, CreateLocationInput, UpdateLocationInput } from '../types/location.types';

class LocationService {
    async getLocations(params: LocationFilters = {}): Promise<LocationsResponse> {
        const response = await apiClient.get(API_ENDPOINTS.LOCATIONS.LIST, { params });
        return response.data.data;
    }

    async getLocation(id: string): Promise<Location> {
        const response = await apiClient.get(API_ENDPOINTS.LOCATIONS.GET(id));
        return response.data.data;
    }

    async searchLocations(query: string): Promise<Location[]> {
        const response = await apiClient.get(API_ENDPOINTS.LOCATIONS.SEARCH, {
            params: { q: query }
        });
        return response.data.data;
    }

    async createLocation(data: CreateLocationInput): Promise<Location> {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: Location;
        }>(API_ENDPOINTS.LOCATIONS.CREATE, data);
        return response.data.data;
    }

    async updateLocation(id: string, data: UpdateLocationInput): Promise<Location> {
        const response = await apiClient.patch<{
            success: boolean;
            message: string;
            data: Location;
        }>(API_ENDPOINTS.LOCATIONS.UPDATE(id), data);
        return response.data.data;
    }

    async deleteLocation(id: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.LOCATIONS.DELETE(id));
    }
}

export const locationService = new LocationService();
