import { z } from "zod";

// Create location schema (admin only)
export const createLocationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(255),
    region: z.string().max(100).optional(),
    country: z.string().max(100).default("Georgia"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// Update location schema (admin only)
export const updateLocationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(255).optional(),
    region: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isActive: z.boolean().optional(),
});

// Query/filter schema for listing locations
export const locationQuerySchema = z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQueryInput = z.infer<typeof locationQuerySchema>;
