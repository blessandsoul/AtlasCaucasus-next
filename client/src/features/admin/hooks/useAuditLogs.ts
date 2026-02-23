import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { auditService } from '../services/audit.service';
import type { AuditLogFilters } from '../types/audit.types';
import { getErrorMessage } from '@/lib/utils/error';

export const useAuditLogs = (filters: AuditLogFilters = {}) => {
  return useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => auditService.getAuditLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useRestoreUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => auditService.restoreUser(userId),
    onSuccess: () => {
      toast.success(t('admin.users.restored'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
