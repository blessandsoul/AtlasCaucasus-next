import { z } from "zod";

const entityTypeEnum = z.enum(["TOUR", "GUIDE", "DRIVER", "COMPANY"]);

export const AddFavoriteSchema = z.object({
    entityType: entityTypeEnum,
    entityId: z.string().uuid(),
});

export const RemoveFavoriteParamsSchema = z.object({
    entityType: entityTypeEnum,
    entityId: z.string().uuid(),
});

export const FavoriteQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    entityType: entityTypeEnum.optional(),
});

export const CheckFavoriteQuerySchema = z.object({
    entityType: entityTypeEnum,
    entityId: z.string().uuid(),
});

export const BatchCheckFavoriteSchema = z.object({
    entityType: entityTypeEnum,
    entityIds: z.array(z.string().uuid()).min(1).max(100),
});
