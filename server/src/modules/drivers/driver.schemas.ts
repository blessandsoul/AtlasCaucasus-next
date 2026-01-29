import { z } from "zod";

// Update driver schema
export const updateDriverSchema = z.object({
    bio: z.string().max(2000).optional(),
    vehicleType: z.string().max(100).optional(),
    vehicleCapacity: z.number().int().min(1).max(100).optional(),
    vehicleMake: z.string().max(100).optional(),
    vehicleModel: z.string().max(100).optional(),
    vehicleYear: z.number().int().min(1900).max(2100).optional(),
    licenseNumber: z.string().max(50).optional(),
    photoUrl: z.string().url("Invalid photo URL").max(512).optional(),
    phoneNumber: z.string().max(20).optional(),
    isVerified: z.boolean().optional(), // Admin only
    isAvailable: z.boolean().optional(),
    locationIds: z.array(z.string().uuid()).optional(),
});

// Query/filter schema for listing drivers
export const driverQuerySchema = z.object({
    locationId: z.string().uuid().optional(),
    vehicleType: z.string().optional(),
    minCapacity: z.coerce.number().int().min(1).optional(),
    isVerified: z.coerce.boolean().optional(),
    isAvailable: z.coerce.boolean().optional(),
    search: z.string().max(200).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sortBy: z.enum(['newest', 'rating', 'capacity']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;
