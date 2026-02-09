import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { aiService } from '../services/ai.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { GenerateRequest, ApplyToTourRequest } from '../types/ai.types';

export const aiKeys = {
  all: ['ai'] as const,
  templates: () => [...aiKeys.all, 'templates'] as const,
  balance: () => [...aiKeys.all, 'balance'] as const,
  creditHistory: (params: Record<string, unknown>) => [...aiKeys.all, 'creditHistory', params] as const,
  generations: (params: Record<string, unknown>) => [...aiKeys.all, 'generations', params] as const,
  generation: (id: string) => [...aiKeys.all, 'generation', id] as const,
};

export const useAiTemplates = () => {
  return useQuery({
    queryKey: aiKeys.templates(),
    queryFn: () => aiService.getTemplates(),
    staleTime: 30 * 60 * 1000,
  });
};

export const useCreditBalance = () => {
  return useQuery({
    queryKey: aiKeys.balance(),
    queryFn: () => aiService.getBalance(),
    staleTime: 60 * 1000,
  });
};

export const useCreditHistory = (params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: aiKeys.creditHistory(params),
    queryFn: () => aiService.getCreditHistory(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAiGenerations = (params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: aiKeys.generations(params),
    queryFn: () => aiService.getGenerations(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAiGeneration = (id: string) => {
  return useQuery({
    queryKey: aiKeys.generation(id),
    queryFn: () => aiService.getGeneration(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateRequest) => aiService.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.balance() });
      queryClient.invalidateQueries({ queryKey: aiKeys.generations({}) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useApplyToTour = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ApplyToTourRequest) => aiService.applyToTour(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['tour'] });
      toast.success(t('ai.apply_success', 'Content applied to tour successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
