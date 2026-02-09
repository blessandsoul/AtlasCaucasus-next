import { z } from "zod";

/**
 * Schema for admin granting credits to a user.
 */
export const adminGrantCreditsSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  amount: z.number().int().positive("Amount must be a positive integer"),
  description: z.string().min(1, "Description is required").max(255, "Description too long"),
});

export type AdminGrantCreditsInput = z.infer<typeof adminGrantCreditsSchema>;
