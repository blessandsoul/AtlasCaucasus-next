import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { inquiryService } from '../services/inquiry.service';
import type { InquiryFilters } from '../types/inquiry.types';

export const useSentInquiries = (filters: InquiryFilters = {}) => {
  return useQuery({
    queryKey: ['inquiries', 'sent', filters],
    queryFn: () => inquiryService.getSentInquiries(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useReceivedInquiries = (filters: InquiryFilters = {}) => {
  return useQuery({
    queryKey: ['inquiries', 'received', filters],
    queryFn: () => inquiryService.getReceivedInquiries(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useInquiry = (id: string) => {
  return useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => inquiryService.getInquiry(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
