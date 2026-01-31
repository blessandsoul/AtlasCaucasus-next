import { z } from 'zod';
import type { TFunction } from 'i18next';
import { createEmailSchema, createNameSchema } from '@/features/auth/schemas/validation';

export const createAgentSchema = (t: TFunction) =>
  z.object({
    email: createEmailSchema(t),
    firstName: createNameSchema(t),
    lastName: createNameSchema(t),
    phoneNumber: z.string().max(20, t('validation.phone_too_long', 'Phone number is too long')).optional(),
  });

export type CreateAgentFormData = z.infer<ReturnType<typeof createAgentSchema>>;
