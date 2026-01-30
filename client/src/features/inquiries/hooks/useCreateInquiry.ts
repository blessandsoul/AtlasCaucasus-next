import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { inquiryService } from '../services/inquiry.service';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import type { CreateInquiryInput } from '../types/inquiry.types';

export const useCreateInquiry = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateInquiryInput) => inquiryService.createInquiry(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success(response.message || 'Inquiry sent successfully');
      router.push(ROUTES.INQUIRIES.SENT);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
