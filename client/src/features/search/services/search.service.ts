import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
    SearchFilters,
    SearchResults,
    LocationSearchResult,
    LocationStats,
} from '../types/search.types';

class SearchService {
    async search(filters: SearchFilters): Promise<SearchResults> {
        const response = await apiClient.get(API_ENDPOINTS.SEARCH.MAIN, { params: filters });
        return response.data.data;
    }

    async searchLocations(query: string, limit = 10): Promise<LocationSearchResult[]> {
        const response = await apiClient.get(API_ENDPOINTS.SEARCH.LOCATIONS, {
            params: { query, limit },
        });
        return response.data.data;
    }

    async getLocationStats(id: string): Promise<LocationStats> {
        const response = await apiClient.get(API_ENDPOINTS.SEARCH.LOCATION_STATS(id));
        return response.data.data;
    }
}

export const searchService = new SearchService();
