import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { driverService } from '../services/driver.service';
import type { DriverFilters, DriverPaginatedResponse } from '../types/driver.types';

export const useDrivers = (filters: DriverFilters = {}) => {
  return useQuery<DriverPaginatedResponse>({
    queryKey: ['drivers', filters],
    queryFn: () => driverService.getDrivers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
};

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverService.getDriver(id),
    enabled: !!id,
  });
};
