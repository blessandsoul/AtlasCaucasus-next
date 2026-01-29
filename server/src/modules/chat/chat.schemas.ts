import { z } from "zod";

export const CreateDirectChatSchema = z.object({
    otherUserId: z.string().uuid("Invalid user ID"),
});

export const CreateGroupChatSchema = z.object({
    name: z.string().min(1, "Name required").max(100, "Name too long"),
    participantIds: z
        .array(z.string().uuid())
        .min(1, "At least one participant required")
        .max(99, "Maximum 99 participants (100 including creator)"),
});

export const SendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
    mentionedUsers: z.array(z.string().uuid()).optional(),
});

export const MarkAsReadSchema = z.object({
    messageId: z.string().uuid().optional(),
});

export const AddParticipantSchema = z.object({
    userId: z.string().uuid(),
});

export const ChatQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const MessagesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: z.string().uuid().optional(), // Message ID for cursor pagination
});

// Type exports for use in controllers
export type CreateDirectChatInput = z.infer<typeof CreateDirectChatSchema>;
export type CreateGroupChatInput = z.infer<typeof CreateGroupChatSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type MarkAsReadInput = z.infer<typeof MarkAsReadSchema>;
export type AddParticipantInput = z.infer<typeof AddParticipantSchema>;
export type ChatQueryInput = z.infer<typeof ChatQuerySchema>;
export type MessagesQueryInput = z.infer<typeof MessagesQuerySchema>;
