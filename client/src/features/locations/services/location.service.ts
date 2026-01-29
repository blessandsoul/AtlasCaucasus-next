import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Location, LocationFilters, LocationsResponse } from '../types/location.types';

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
}

export const locationService = new LocationService();
