'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { guideService } from '../services/guide.service';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import type { Guide } from '../types/guide.types';

export const useMyGuide = () => {
    return useQuery({
        queryKey: ['my-guide'],
        queryFn: () => guideService.getMyGuide(),
        staleTime: 5 * 60 * 1000,
    });
};

export const useUpdateGuide = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Guide> }) =>
            guideService.updateGuide(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            toast.success(t('common.saved_successfully', 'Saved successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

export const useDeleteGuide = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (id: string) => guideService.deleteGuide(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            toast.success(t('common.deleted_successfully', 'Deleted successfully'));
            router.push(ROUTES.DASHBOARD);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

// Photo management hooks
export const useGuidePhotos = (id: string) => {
    return useQuery({
        queryKey: ['guide-photos', id],
        queryFn: () => guideService.getPhotos(id),
        enabled: !!id,
    });
};

export const useUploadGuidePhotos = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, files }: { id: string; files: File | File[] }) =>
            guideService.uploadPhotos(id, files),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            queryClient.invalidateQueries({ queryKey: ['guide-photos', id] });
            toast.success(t('common.photo_uploaded', 'Photo uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

export const useDeleteGuidePhoto = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({ id, photoId }: { id: string; photoId: string }) =>
            guideService.deletePhoto(id, photoId),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['my-guide'] });
            queryClient.invalidateQueries({ queryKey: ['guide-photos', id] });
            toast.success(t('common.photo_deleted', 'Photo deleted successfully'));
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};
