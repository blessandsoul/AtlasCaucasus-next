import { z } from "zod";

// Admin-only: create user with optional role
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["USER", "COMPANY", "ADMIN", "TOUR_AGENT", "GUIDE", "DRIVER"]).optional(),
});

// Self-update: users can only update their own profile fields (no role, no isActive)
export const updateUserSelfSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
});

// Admin-update: admins can update any field including role and isActive
export const updateUserAdminSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  role: z.enum(["USER", "COMPANY", "ADMIN", "TOUR_AGENT", "GUIDE", "DRIVER"]).optional(),
  isActive: z.boolean().optional(),
});

// Admin-only: change user role
export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "COMPANY", "ADMIN", "TOUR_AGENT", "GUIDE", "DRIVER"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be USER, COMPANY, ADMIN, TOUR_AGENT, GUIDE, or DRIVER",
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserSelfInput = z.infer<typeof updateUserSelfSchema>;
export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
