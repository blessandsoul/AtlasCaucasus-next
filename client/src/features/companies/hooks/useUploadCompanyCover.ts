'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { companyService } from '../services/company.service';
import { getFileUploadErrorMessage } from '@/features/media';

export const useUploadCompanyCover = (companyId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (file: File) => {
            if (!companyId) {
                throw new Error('Company ID is required');
            }
            return companyService.uploadCover(companyId, file);
        },
        onSuccess: () => {
            // Invalidate company queries to refetch with new cover
            queryClient.invalidateQueries({ queryKey: ['company', companyId] });
            queryClient.invalidateQueries({ queryKey: ['my-company'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('company.cover_uploaded', 'Cover image uploaded successfully'));
        },
        onError: (error) => {
            toast.error(getFileUploadErrorMessage(error));
        },
    });
};
