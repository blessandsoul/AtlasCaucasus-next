import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { companyService } from '../services/company.service';
import type { CompaniesResponse, CompanyFilters } from '../types/company.types';

export interface UseCompaniesParams extends CompanyFilters {
  page?: number;
  limit?: number;
}

export const useCompanies = (params: UseCompaniesParams = {}) => {
  return useQuery<CompaniesResponse>({
    queryKey: ['companies', params],
    queryFn: () => companyService.getCompanies(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompany(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
