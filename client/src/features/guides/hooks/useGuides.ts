import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { guideService } from '../services/guide.service';
import type { GuideFilters, GuidePaginatedResponse } from '../types/guide.types';

export const useGuides = (filters: GuideFilters = {}) => {
  return useQuery<GuidePaginatedResponse>({
    queryKey: ['guides', filters],
    queryFn: () => guideService.getGuides(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
};

export const useGuide = (id: string) => {
  return useQuery({
    queryKey: ['guide', id],
    queryFn: () => guideService.getGuide(id),
    enabled: !!id,
  });
};
