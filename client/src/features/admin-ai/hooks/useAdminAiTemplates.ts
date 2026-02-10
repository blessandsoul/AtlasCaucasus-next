import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminAiService } from '../services/admin-ai.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { UpdateAiTemplateRequest } from '../types/admin-ai.types';

export const adminAiKeys = {
  all: ['admin', 'ai-templates'] as const,
  list: () => [...adminAiKeys.all, 'list'] as const,
  detail: (id: string) => [...adminAiKeys.all, 'detail', id] as const,
};

export const useAdminAiTemplates = () => {
  return useQuery({
    queryKey: adminAiKeys.list(),
    queryFn: () => adminAiService.getTemplates(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAdminAiTemplate = (id: string) => {
  return useQuery({
    queryKey: adminAiKeys.detail(id),
    queryFn: () => adminAiService.getTemplate(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateAiTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAiTemplateRequest }) =>
      adminAiService.updateTemplate(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminAiKeys.list() });
      queryClient.invalidateQueries({ queryKey: adminAiKeys.detail(result.id) });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResetAiTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminAiService.resetTemplate(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminAiKeys.list() });
      queryClient.invalidateQueries({ queryKey: adminAiKeys.detail(result.id) });
      toast.success('Template reset to defaults');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useToggleAiTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminAiService.toggleTemplate(id, isActive),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminAiKeys.list() });
      queryClient.invalidateQueries({ queryKey: adminAiKeys.detail(result.id) });
      toast.success(result.isActive ? 'Template enabled' : 'Template disabled');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
