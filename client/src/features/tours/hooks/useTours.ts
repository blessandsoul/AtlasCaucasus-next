import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { tourService } from '../services/tour.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { TourFilters, UpdateTourInput, MyToursParams, ToursResponse } from '../types/tour.types';

interface UseToursParams extends TourFilters {
    page?: number;
    limit?: number;
}

export const useTours = (params: UseToursParams = {}) => {
    return useQuery({
        queryKey: ['tours', params],
        queryFn: () => tourService.getTours(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: keepPreviousData, // Smooth pagination transitions
    });
};

export const useTour = (id: string) => {
    return useQuery({
        queryKey: ['tour', id],
        queryFn: () => tourService.getTour(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

interface UseCompanyToursParams {
    page?: number;
    limit?: number;
}

export const useCompanyTours = (companyId: string, params: UseCompanyToursParams = {}) => {
    return useQuery({
        queryKey: ['companyTours', companyId, params],
        queryFn: () => tourService.getCompanyTours(companyId, params),
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
};

export const useMyTours = (params: MyToursParams = {}) => {
    return useQuery<ToursResponse>({
        queryKey: ['tours', 'my', params],
        queryFn: () => tourService.getMyTours(params),
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
};

export const useUpdateTour = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTourInput }) =>
            tourService.updateTour(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['tours', 'my'] });
            queryClient.invalidateQueries({ queryKey: ['tour', id] });
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            toast.success(t('tours.update_success', 'Tour updated successfully!'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

export const useDeleteTour = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (id: string) => tourService.deleteTour(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['tours', 'my'] });
            queryClient.removeQueries({ queryKey: ['tour', id] });
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            toast.success(t('tours.delete_success', 'Tour deleted successfully!'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};
