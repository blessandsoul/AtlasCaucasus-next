import * as argon2 from "argon2";
import * as userRepo from "./user.repo.js";
import type { SafeUser, User, UserRole } from "./user.types.js";
import type {
  CreateUserInput,
  UpdateUserSelfInput,
  UpdateUserAdminInput,
  UpdateUserRoleInput,
} from "./user.schemas.js";
import { ConflictError, NotFoundError } from "../../libs/errors.js";
import { getMediaByEntity } from "../media/media.repo.js";

async function toSafeUser(user: User): Promise<SafeUser> {
  const media = await getMediaByEntity("user", user.id);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles || [],
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    avatar: media.length > 0 ? media[0] : undefined, // First image as avatar

    // Profiles
    companyProfile: user.companyProfile,
    guideProfile: user.guideProfile,
    driverProfile: user.driverProfile,

    // Profile IDs (keep for backward compat or convenience)
    driverProfileId: user.driverProfile?.id,
    guideProfileId: user.guideProfile?.id,
  };
}

// Admin-only: create user with optional role
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const existingUser = await userRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password);

  const user = await userRepo.createUser({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
  });

  return await toSafeUser(user);
}

export async function getUserById(id: string): Promise<SafeUser> {
  // Use findUserWithProfiles to get full details including roles and profiles
  const user = await userRepo.findUserWithProfiles(id);
  if (!user) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  return await toSafeUser(user);
}

// Admin-only: get all users
export async function getAllUsers(
  page: number,
  limit: number
): Promise<{ items: SafeUser[]; totalItems: number }> {
  const offset = (page - 1) * limit;

  const users = await userRepo.findAllUsers(offset, limit);
  const totalItems = await userRepo.countAllUsers();

  const safeUsers = await Promise.all(users.map(toSafeUser));

  return {
    items: safeUsers,
    totalItems,
  };
}

// Self-update: user can only update their own profile fields (no role, no isActive)
export async function updateUserSelf(
  id: string,
  input: UpdateUserSelfInput
): Promise<SafeUser> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  if (input.email && input.email !== existingUser.email) {
    const emailTaken = await userRepo.findUserByEmail(input.email);
    if (emailTaken) {
      throw new ConflictError("Email already in use", "EMAIL_EXISTS");
    }
  }

  const user = await userRepo.updateUser(id, {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  return await toSafeUser(user);
}

// Admin-update: admin can update any field including role and isActive
export async function updateUserAdmin(
  id: string,
  input: UpdateUserAdminInput
): Promise<SafeUser> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  if (input.email && input.email !== existingUser.email) {
    const emailTaken = await userRepo.findUserByEmail(input.email);
    if (emailTaken) {
      throw new ConflictError("Email already in use", "EMAIL_EXISTS");
    }
  }

  const user = await userRepo.updateUser(id, {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    isActive: input.isActive,
  });

  return await toSafeUser(user);
}

// Admin-only: update user role (add role to user)
export async function updateUserRole(
  id: string,
  input: UpdateUserRoleInput
): Promise<SafeUser> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  // Add the role to the user (uses upsert, so it won't duplicate)
  await userRepo.addUserRole(id, input.role);

  // Fetch updated user with new roles
  const updatedUser = await userRepo.findUserById(id);
  if (!updatedUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  return await toSafeUser(updatedUser);
}

// Admin-only: remove user role
export async function removeUserRole(
  id: string,
  input: UpdateUserRoleInput
): Promise<SafeUser> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  // Remove the role
  await userRepo.removeUserRole(id, input.role);

  // Fetch updated user
  const updatedUser = await userRepo.findUserById(id);
  if (!updatedUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  return await toSafeUser(updatedUser);
}

export async function deleteUser(id: string): Promise<void> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  await userRepo.softDeleteUser(id);
}
