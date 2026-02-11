import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
    Booking,
    BookingsResponse,
    BookingFilters,
    CreateDirectBookingInput,
    ConfirmBookingInput,
    DeclineBookingInput,
    AvailabilityResult,
} from '../types/booking.types';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

class BookingService {
    async getBookings(params: BookingFilters = {}): Promise<BookingsResponse> {
        const response = await apiClient.get<ApiResponse<BookingsResponse>>(
            API_ENDPOINTS.BOOKINGS.LIST,
            { params },
        );

        return response.data.data;
    }

    async getReceivedBookings(params: BookingFilters = {}): Promise<BookingsResponse> {
        const response = await apiClient.get<ApiResponse<BookingsResponse>>(
            API_ENDPOINTS.BOOKINGS.RECEIVED,
            { params },
        );

        return response.data.data;
    }

    async getBooking(id: string): Promise<Booking> {
        const response = await apiClient.get<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.GET(id),
        );

        return response.data.data;
    }

    async createBooking(data: CreateDirectBookingInput): Promise<Booking> {
        const response = await apiClient.post<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.CREATE,
            data,
        );

        return response.data.data;
    }

    async confirmBooking(id: string, data: ConfirmBookingInput): Promise<Booking> {
        const response = await apiClient.patch<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.CONFIRM(id),
            data,
        );

        return response.data.data;
    }

    async declineBooking(id: string, data: DeclineBookingInput): Promise<Booking> {
        const response = await apiClient.patch<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.DECLINE(id),
            data,
        );

        return response.data.data;
    }

    async cancelBooking(id: string): Promise<Booking> {
        const response = await apiClient.patch<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.CANCEL(id),
        );

        return response.data.data;
    }

    async completeBooking(id: string): Promise<Booking> {
        const response = await apiClient.patch<ApiResponse<Booking>>(
            API_ENDPOINTS.BOOKINGS.COMPLETE(id),
        );

        return response.data.data;
    }

    async checkTourAvailability(
        tourId: string,
        date: string,
        guests: number,
    ): Promise<AvailabilityResult> {
        const response = await apiClient.get<ApiResponse<AvailabilityResult>>(
            API_ENDPOINTS.TOURS.AVAILABILITY(tourId),
            { params: { date, guests } },
        );

        return response.data.data;
    }
}

export const bookingService = new BookingService();
