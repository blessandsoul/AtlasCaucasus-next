import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import type { SearchFilters } from '../types/search.types';

export const useSearch = (filters: SearchFilters, enabled = true) => {
    return useQuery({
        queryKey: ['search', filters],
        queryFn: () => searchService.search(filters),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSearchLocations = (query: string, limit = 10) => {
    return useQuery({
        queryKey: ['search', 'locations', query, limit],
        queryFn: () => searchService.searchLocations(query, limit),
        enabled: query.length >= 1,
        staleTime: 60 * 1000,
    });
};

export const useLocationStats = (id: string | undefined) => {
    return useQuery({
        queryKey: ['search', 'location-stats', id],
        queryFn: () => searchService.getLocationStats(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};
