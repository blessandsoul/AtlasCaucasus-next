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
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}
