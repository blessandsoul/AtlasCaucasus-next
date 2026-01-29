import { z } from "zod";

export const createTourSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
  price: z.number().min(0, "Price must be at least 0"),
  summary: z.string().max(1000, "Summary must be at most 1000 characters").optional(),
  currency: z.string().length(3, "Currency must be exactly 3 characters").optional(),
  city: z.string().max(100, "City must be at most 100 characters").optional(),
  startLocation: z.string().max(100, "Start location must be at most 100 characters").optional(),
  originalPrice: z.number().min(0, "Original price must be at least 0").optional(),
  durationMinutes: z.number().int().min(0, "Duration must be at least 0").optional(),
  maxPeople: z.number().int().min(1, "Max people must be at least 1").optional(),
  isInstantBooking: z.boolean().optional(),
  hasFreeCancellation: z.boolean().optional(),
  nextAvailableDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
});

export const updateTourSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters").optional(),
  price: z.number().min(0, "Price must be at least 0").optional(),
  summary: z.string().max(1000, "Summary must be at most 1000 characters").nullable().optional(),
  currency: z.string().length(3, "Currency must be exactly 3 characters").optional(),
  city: z.string().max(100, "City must be at most 100 characters").nullable().optional(),
  startLocation: z.string().max(100, "Start location must be at most 100 characters").nullable().optional(),
  originalPrice: z.number().min(0, "Original price must be at least 0").nullable().optional(),
  durationMinutes: z.number().int().min(0, "Duration must be at least 0").nullable().optional(),
  maxPeople: z.number().int().min(1, "Max people must be at least 1").nullable().optional(),
  isActive: z.boolean().optional(),
  isInstantBooking: z.boolean().optional(),
  hasFreeCancellation: z.boolean().optional(),
  nextAvailableDate: z.coerce.date().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
});

export const listToursQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const listAllToursQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  locationId: z.string().uuid().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDuration: z.coerce.number().int().min(0).optional(),
  maxDuration: z.coerce.number().int().min(0).optional(),
  maxPeople: z.coerce.number().int().min(1).optional(),
  isFeatured: z.coerce.boolean().optional(),
  sortBy: z.enum(['newest', 'rating', 'price', 'price_desc']).optional(),
});

export type CreateTourInput = z.infer<typeof createTourSchema>;
export type UpdateTourInput = z.infer<typeof updateTourSchema>;
export type ListToursQuery = z.infer<typeof listToursQuerySchema>;
export type ListAllToursQuery = z.infer<typeof listAllToursQuerySchema>;
