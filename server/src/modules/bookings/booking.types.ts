import type { BookingStatus } from "@prisma/client";

export type BookingEntityType = "TOUR" | "GUIDE" | "DRIVER";

export interface CreateBookingData {
    userId: string;
    entityType: BookingEntityType;
    entityId: string;
    inquiryId?: string;
    date?: Date;
    guests?: number;
    totalPrice?: number;
    currency?: string;
    notes?: string;
}

export interface CreateDirectBookingData {
    userId: string;
    entityType: BookingEntityType;
    entityId: string;
    date: Date;
    guests: number;
    notes?: string;
    contactPhone?: string;
    contactEmail?: string;
}

export interface ConfirmBookingData {
    providerNotes?: string;
}

export interface DeclineBookingData {
    declinedReason: string;
}

export interface BookingFilters {
    status?: BookingStatus;
    entityType?: BookingEntityType;
}

export interface BookingWithUser {
    id: string;
    userId: string;
    entityType: string;
    entityId: string;
    inquiryId: string | null;
    status: BookingStatus;
    date: Date | null;
    guests: number | null;
    totalPrice: string | null;
    currency: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt: Date | null;
    providerNotes: string | null;
    confirmedAt: Date | null;
    declinedAt: Date | null;
    declinedReason: string | null;
    completedAt: Date | null;
    entityName: string | null;
    entityImage: string | null;
    providerUserId: string | null;
    providerName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    referenceNumber: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface AvailabilityResult {
    available: boolean;
    remainingSpots: number;
    reason?: string;
}
