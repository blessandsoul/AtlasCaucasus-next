export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DECLINED';
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

    // Provider-facing fields
    providerNotes: string | null;
    confirmedAt: string | null;
    declinedAt: string | null;
    declinedReason: string | null;
    completedAt: string | null;

    // Denormalized entity info
    entityName: string | null;
    entityImage: string | null;
    providerUserId: string | null;
    providerName: string | null;

    // Contact info
    contactPhone: string | null;
    contactEmail: string | null;

    // Human-readable reference
    referenceNumber: string | null;

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

export interface CreateDirectBookingInput {
    entityType: BookingEntityType;
    entityId: string;
    date: string;
    guests: number;
    notes?: string;
    contactPhone?: string;
    contactEmail?: string;
}

export interface ConfirmBookingInput {
    providerNotes?: string;
}

export interface DeclineBookingInput {
    declinedReason: string;
}

export interface AvailabilityResult {
    available: boolean;
    remainingSpots: number;
    reason?: string;
}
