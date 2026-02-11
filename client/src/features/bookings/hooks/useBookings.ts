'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/booking.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
    BookingFilters,
    CreateDirectBookingInput,
    ConfirmBookingInput,
    DeclineBookingInput,
} from '../types/booking.types';

// Query key factory
export const bookingKeys = {
    all: ['bookings'] as const,
    lists: () => [...bookingKeys.all, 'list'] as const,
    list: (filters?: BookingFilters) => [...bookingKeys.lists(), filters] as const,
    received: () => [...bookingKeys.all, 'received'] as const,
    receivedList: (filters?: BookingFilters) => [...bookingKeys.received(), filters] as const,
    details: () => [...bookingKeys.all, 'detail'] as const,
    detail: (id: string) => [...bookingKeys.details(), id] as const,
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
 * Hook to fetch a single booking detail
 */
export const useBooking = (id: string) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: bookingKeys.detail(id),
        queryFn: () => bookingService.getBooking(id),
        enabled: isAuthenticated && !!id,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to create a direct booking
 */
export const useCreateBooking = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDirectBookingInput) => bookingService.createBooking(data),
        onSuccess: () => {
            toast.success(t('bookings.create_success', 'Booking submitted successfully'));
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

/**
 * Hook to confirm a booking (provider)
 */
export const useConfirmBooking = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, data }: { bookingId: string; data: ConfirmBookingInput }) =>
            bookingService.confirmBooking(bookingId, data),
        onSuccess: () => {
            toast.success(t('bookings.confirm_success', 'Booking confirmed successfully'));
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
};

/**
 * Hook to decline a booking (provider)
 */
export const useDeclineBooking = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, data }: { bookingId: string; data: DeclineBookingInput }) =>
            bookingService.declineBooking(bookingId, data),
        onSuccess: () => {
            toast.success(t('bookings.decline_success', 'Booking declined'));
            queryClient.invalidateQueries({ queryKey: bookingKeys.all });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
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

/**
 * Hook to check tour availability for a specific date and guest count
 */
export const useTourAvailability = (
    tourId: string,
    date: string | null,
    guests: number,
) => {
    return useQuery({
        queryKey: ['tours', 'availability', tourId, date, guests] as const,
        queryFn: () => bookingService.checkTourAvailability(tourId, date!, guests),
        enabled: !!tourId && !!date && guests > 0,
        staleTime: 30 * 1000,
    });
};
