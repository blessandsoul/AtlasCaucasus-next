import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { companyService } from '../services/company.service';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import type { CompaniesResponse, CompanyFilters, IUpdateCompanyRequest, CreateAgentFormData } from '../types/company.types';

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

export const useTourAgents = () => {
  return useQuery({
    queryKey: ['company', 'agents'],
    queryFn: () => companyService.getTourAgents(),
    staleTime: 5 * 60 * 1000,
  });
};

// Dashboard management hooks
export const useMyCompany = () => {
  return useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyService.getMyCompany(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateCompanyRequest }) =>
      companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      toast.success(t('company.update_success', 'Company updated successfully!'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      toast.success(t('company.delete_success', 'Company deleted successfully!'));
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Photo management hooks
export const useCompanyPhotos = (id: string) => {
  return useQuery({
    queryKey: ['company-photos', id],
    queryFn: () => companyService.getPhotos(id),
    enabled: !!id,
  });
};

export const useUploadCompanyPhotos = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File | File[] }) =>
      companyService.uploadPhotos(id, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-photos', id] });
      toast.success(t('common.photo_uploaded', 'Photo uploaded successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteCompanyPhoto = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, photoId }: { id: string; photoId: string }) =>
      companyService.deletePhoto(id, photoId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-photos', id] });
      toast.success(t('common.photo_deleted', 'Photo deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Tour agent management hooks
export const useCreateTourAgent = () => {
  return useMutation({
    mutationFn: (data: CreateAgentFormData) => companyService.createTourAgent(data),
    onSuccess: (response) => {
      toast.success('Tour agent created successfully!', {
        description: `Temporary password: ${response.temporaryPassword}`,
        duration: 10000,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
