import { z } from "zod";
import { InquiryStatus, InquiryTargetType } from "@prisma/client";

/**
 * Schema for creating an inquiry
 */
export const CreateInquirySchema = z.object({
    targetType: z.nativeEnum(InquiryTargetType),
    targetIds: z
        .array(z.string().uuid())
        .min(1, "At least one target required")
        .max(10, "Maximum 10 targets allowed"),
    subject: z
        .string()
        .min(3, "Subject must be at least 3 characters")
        .max(200, "Subject too long"),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message too long"),
});

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;

/**
 * Schema for responding to an inquiry
 */
export const RespondToInquirySchema = z.object({
    status: z.enum([
        InquiryStatus.RESPONDED,
        InquiryStatus.ACCEPTED,
        InquiryStatus.DECLINED,
    ]),
    message: z
        .string()
        .min(1, "Response message required")
        .max(2000, "Message too long")
        .optional(),
});

export type RespondToInquiryInput = z.infer<typeof RespondToInquirySchema>;

/**
 * Schema for querying inquiries
 */
export const InquiryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.nativeEnum(InquiryStatus).optional(),
    targetType: z.nativeEnum(InquiryTargetType).optional(),
});

export type InquiryQueryInput = z.infer<typeof InquiryQuerySchema>;
