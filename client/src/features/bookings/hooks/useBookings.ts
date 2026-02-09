'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/booking.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BookingFilters } from '../types/booking.types';

// Query key factory
export const bookingKeys = {
    all: ['bookings'] as const,
    lists: () => [...bookingKeys.all, 'list'] as const,
    list: (filters?: BookingFilters) => [...bookingKeys.lists(), filters] as const,
    received: () => [...bookingKeys.all, 'received'] as const,
    receivedList: (filters?: BookingFilters) => [...bookingKeys.received(), filters] as const,
};

/**
 * Hook to list user's bookings (as customer)
 */
export const useBookings = (params: BookingFilters = {}) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: bookingKeys.list(params),
        queryFn: () => bookingService.getBookings(params),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to list provider's received bookings
 */
export const useReceivedBookings = (params: BookingFilters = {}) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: bookingKeys.receivedList(params),
        queryFn: () => bookingService.getReceivedBookings(params),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to cancel a booking
 */
export const useCancelBooking = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
        onSuccess: () => {
            toast.success(t('bookings.cancel_success', 'Booking cancelled successfully'));
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

/**
 * Hook to mark a booking as completed (provider)
 */
export const useCompleteBooking = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bookingId: string) => bookingService.completeBooking(bookingId),
        onSuccess: () => {
            toast.success(t('bookings.complete_success', 'Booking marked as completed'));
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};
