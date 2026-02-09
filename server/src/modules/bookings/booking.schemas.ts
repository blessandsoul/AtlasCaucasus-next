import { z } from "zod";

const bookingEntityType = z.enum(["TOUR", "GUIDE", "DRIVER"]);
const bookingStatus = z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]);

export const BookingQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: bookingStatus.optional(),
    entityType: bookingEntityType.optional(),
});

export const BookingIdParamSchema = z.object({
    id: z.string().uuid(),
});
