'use client';

import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/location.service';
import type { LocationFilters } from '../types/location.types';

export const useLocations = (params: LocationFilters = {}) => {
    return useQuery({
        queryKey: ['locations', params],
        queryFn: () => locationService.getLocations(params),
        staleTime: 10 * 60 * 1000, // 10 minutes - locations don't change often
    });
};

export const useLocation = (id: string) => {
    return useQuery({
        queryKey: ['location', id],
        queryFn: () => locationService.getLocation(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
};

export const useSearchLocations = (query: string) => {
    return useQuery({
        queryKey: ['locations', 'search', query],
        queryFn: () => locationService.searchLocations(query),
        enabled: query.length >= 2,
        staleTime: 5 * 60 * 1000,
    });
};
