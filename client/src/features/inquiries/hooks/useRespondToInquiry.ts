import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inquiryService } from '../services/inquiry.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { RespondToInquiryInput } from '../types/inquiry.types';

export const useRespondToInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RespondToInquiryInput }) =>
      inquiryService.respondToInquiry(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['inquiry'] });
      toast.success(response.message || 'Response sent successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
