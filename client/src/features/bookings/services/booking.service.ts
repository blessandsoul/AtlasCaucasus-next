import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Booking, BookingsResponse, BookingFilters } from '../types/booking.types';

class BookingService {
    async getBookings(params: BookingFilters = {}): Promise<BookingsResponse> {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: BookingsResponse;
        }>(API_ENDPOINTS.BOOKINGS.LIST, { params });

        return response.data.data;
    }

    async getReceivedBookings(params: BookingFilters = {}): Promise<BookingsResponse> {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: BookingsResponse;
        }>(API_ENDPOINTS.BOOKINGS.RECEIVED, { params });

        return response.data.data;
    }

    async cancelBooking(id: string): Promise<Booking> {
        const response = await apiClient.patch<{
            success: boolean;
            message: string;
            data: Booking;
        }>(API_ENDPOINTS.BOOKINGS.CANCEL(id));

        return response.data.data;
    }

    async completeBooking(id: string): Promise<Booking> {
        const response = await apiClient.patch<{
            success: boolean;
            message: string;
            data: Booking;
        }>(API_ENDPOINTS.BOOKINGS.COMPLETE(id));

        return response.data.data;
    }
}

export const bookingService = new BookingService();
