import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const NotificationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isRead: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
    type: z.nativeEnum(NotificationType).optional(),
});

export const MarkAsReadSchema = z.object({
    notificationIds: z.array(z.string().uuid()).optional(), // If empty, mark all
});

export type NotificationQueryInput = z.infer<typeof NotificationQuerySchema>;
export type MarkAsReadInput = z.infer<typeof MarkAsReadSchema>;
