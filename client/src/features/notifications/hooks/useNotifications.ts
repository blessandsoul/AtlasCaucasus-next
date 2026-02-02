import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../services/notification.service';
import { getErrorMessage } from '@/lib/utils/error';
import type { INotificationFilters } from '../types/notification.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: INotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const useNotifications = (
  params: INotificationFilters = {},
  options?: { enabled?: boolean }
) => {
  const isEnabled = options?.enabled ?? false;

  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute - notifications should be fresher
    placeholderData: keepPreviousData,
    enabled: isEnabled, // Disabled by default - requires auth check
  });
};

export const useUnreadCount = (options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled ?? false;

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds - check frequently
    refetchInterval: isEnabled ? 60 * 1000 : false, // Only refetch when enabled
    enabled: isEnabled, // Disabled by default - requires auth check
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        t(
          'notifications.all_marked_read',
          `${data.count} notifications marked as read`
        )
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(
        t('notifications.deleted', 'Notification deleted')
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
