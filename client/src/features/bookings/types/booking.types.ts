export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BookingEntityType = 'TOUR' | 'GUIDE' | 'DRIVER';

export interface Booking {
    id: string;
    userId: string;
    entityType: BookingEntityType;
    entityId: string;
    inquiryId: string | null;
    status: BookingStatus;
    date: string | null;
    guests: number | null;
    totalPrice: string | null;
    currency: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    cancelledAt: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface BookingsResponse {
    items: Booking[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface BookingFilters {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    entityType?: BookingEntityType;
}
