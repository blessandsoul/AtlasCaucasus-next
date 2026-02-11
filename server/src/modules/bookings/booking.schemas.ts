import { z } from "zod";

const bookingEntityType = z.enum(["TOUR", "GUIDE", "DRIVER"]);
const bookingStatus = z.enum(["PENDING", "CONFIRMED", "DECLINED", "COMPLETED", "CANCELLED"]);

export const BookingQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: bookingStatus.optional(),
    entityType: bookingEntityType.optional(),
});

export const BookingIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const CreateDirectBookingSchema = z.object({
    entityType: z.enum(["TOUR", "GUIDE", "DRIVER"]),
    entityId: z.string().uuid(),
    date: z.coerce.date().refine(
        (d) => {
            // Compare date-only using UTC to avoid timezone issues
            // Client sends "YYYY-MM-DD" which parses as midnight UTC
            const now = new Date();
            const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
            const bookingUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
            return bookingUTC > todayUTC;
        },
        { message: "Booking date must be in the future" }
    ),
    guests: z.coerce.number().int().min(1).max(100),
    notes: z.string().max(1000).optional(),
    contactPhone: z.string().max(20).optional(),
    contactEmail: z.string().email().optional(),
});

export const ConfirmBookingSchema = z.object({
    providerNotes: z.string().max(1000).optional(),
});

export const DeclineBookingSchema = z.object({
    declinedReason: z.string().min(1, "Reason is required").max(1000),
});

export const AvailabilityQuerySchema = z.object({
    date: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: "Invalid date format" }
    ),
    guests: z.coerce.number().int().min(1).max(100),
});

export const TourIdParamSchema = z.object({
    id: z.string().uuid(),
});
