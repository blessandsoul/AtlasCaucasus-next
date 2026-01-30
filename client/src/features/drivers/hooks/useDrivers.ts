import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { driverService } from '../services/driver.service';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import type { Driver, DriverFilters, DriverPaginatedResponse } from '../types/driver.types';

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

// Dashboard management hooks
export const useMyDriver = () => {
  return useQuery({
    queryKey: ['my-driver'],
    queryFn: () => driverService.getMyDriver(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      driverService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-driver'] });
      toast.success(t('common.saved_successfully', 'Saved successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => driverService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-driver'] });
      toast.success(t('common.deleted_successfully', 'Deleted successfully'));
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Photo management hooks
export const useDriverPhotos = (id: string) => {
  return useQuery({
    queryKey: ['driver-photos', id],
    queryFn: () => driverService.getPhotos(id),
    enabled: !!id,
  });
};

export const useUploadDriverPhotos = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File | File[] }) =>
      driverService.uploadPhotos(id, files),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['my-driver'] });
      queryClient.invalidateQueries({ queryKey: ['driver-photos', id] });
      toast.success(t('common.photo_uploaded', 'Photo uploaded successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteDriverPhoto = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, photoId }: { id: string; photoId: string }) =>
      driverService.deletePhoto(id, photoId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['my-driver'] });
      queryClient.invalidateQueries({ queryKey: ['driver-photos', id] });
      toast.success(t('common.photo_deleted', 'Photo deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
