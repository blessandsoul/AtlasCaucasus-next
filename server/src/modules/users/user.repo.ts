import { prisma } from "../../libs/prisma.js";
import type { User, CreateUserData, UpdateUserData, UserRole } from "./user.types.js";
import type { User as PrismaUser, UserRole as PrismaUserRole } from "@prisma/client";

// Convert Prisma User to our User type
function toUser(prismaUser: PrismaUser & { companyProfile?: any; guideProfile?: any; driverProfile?: any }): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    passwordHash: prismaUser.passwordHash,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    phoneNumber: prismaUser.phoneNumber,
    isActive: prismaUser.isActive,
    tokenVersion: prismaUser.tokenVersion,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    deletedAt: prismaUser.deletedAt,
    parentCompanyId: prismaUser.parentCompanyId,
    emailVerified: prismaUser.emailVerified,
    emailNotifications: prismaUser.emailNotifications,
    verificationToken: prismaUser.verificationToken,
    verificationTokenExpiresAt: prismaUser.verificationTokenExpiresAt,
    resetPasswordToken: prismaUser.resetPasswordToken,
    resetPasswordTokenExpiresAt: prismaUser.resetPasswordTokenExpiresAt,
    invitationToken: prismaUser.invitationToken,
    invitationTokenExpiresAt: prismaUser.invitationTokenExpiresAt,
    failedLoginAttempts: prismaUser.failedLoginAttempts,
    lockedUntil: prismaUser.lockedUntil,
    roles: (prismaUser as any).roles?.map((r: any) => r.role as UserRole) || [],

    // Profiles
    companyProfile: prismaUser.companyProfile,
    guideProfile: prismaUser.guideProfile,
    driverProfile: prismaUser.driverProfile,
  };
}

export async function createUser(data: CreateUserData): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: {
        create: {
          role: (data.role || "USER") as PrismaUserRole,
        },
      },
    },
    include: {
      roles: true,
    },
  });

  return toUser(user);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

  return user ? toUser(user) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      roles: true,
    },
  });

  return user ? toUser(user) : null;
}

export async function findAllUsers(skip: number, take: number, includeDeleted = false): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
    include: {
      roles: true,
    },
  });

  return users.map(toUser);
}

export async function countAllUsers(includeDeleted = false): Promise<number> {
  return prisma.user.count({
    where: includeDeleted ? {} : { deletedAt: null },
  });
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      passwordHash: data.passwordHash,
      emailVerified: data.emailVerified,
      emailNotifications: data.emailNotifications,
      verificationToken: data.verificationToken,
      verificationTokenExpiresAt: data.verificationTokenExpiresAt,
      resetPasswordToken: data.resetPasswordToken,
      resetPasswordTokenExpiresAt: data.resetPasswordTokenExpiresAt,
      invitationToken: data.invitationToken,
      invitationTokenExpiresAt: data.invitationTokenExpiresAt,
      failedLoginAttempts: data.failedLoginAttempts,
      lockedUntil: data.lockedUntil,
      tokenVersion: data.tokenVersion,
      isActive: data.isActive,
    },
  });

  return toUser(user);
}

export async function incrementTokenVersion(id: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  return toUser(user);
}

export async function softDeleteUser(id: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  return toUser(user);
}

export async function findDeletedUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: { not: null },
    },
    include: {
      roles: true,
      companyProfile: true,
      guideProfile: true,
      driverProfile: true,
    },
  });

  return user ? toUser(user) : null;
}

export async function restoreUser(id: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
    include: {
      roles: true,
      companyProfile: true,
      guideProfile: true,
      driverProfile: true,
    },
  });

  return toUser(user);
}

// ==========================================
// USER ROLES
// ==========================================

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const roleAssignments = await prisma.userRoleAssignment.findMany({
    where: { userId },
    select: { role: true },
  });

  return roleAssignments.map((r) => r.role as UserRole);
}

export async function addUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId,
          role: role as PrismaUserRole,
        },
      },
      update: {},
      create: {
        userId,
        role: role as PrismaUserRole,
      },
    });
  } catch (err: any) {
    // Ignore unique constraint violation from concurrent upserts — role already exists
    if (err?.code === "P2002") return;
    throw err;
  }
}

export async function removeUserRole(userId: string, role: UserRole): Promise<void> {
  await prisma.userRoleAssignment.deleteMany({
    where: {
      userId,
      role: role as PrismaUserRole,
    },
  });
}

export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const count = await prisma.userRoleAssignment.count({
    where: {
      userId,
      role: role as PrismaUserRole,
    },
  });

  return count > 0;
}

// ==========================================
// PROFILE TYPES
// ==========================================

export interface CompanyProfileData {
  companyName: string;
  description?: string;
  registrationNumber?: string;
  logoUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
}

export interface GuideProfileData {
  bio?: string;
  languages?: string[];
  yearsOfExperience?: number;
  photoUrl?: string;
  phoneNumber?: string;
}

export interface DriverProfileData {
  bio?: string;
  vehicleType?: string;
  vehicleCapacity?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licenseNumber?: string;
  photoUrl?: string;
  phoneNumber?: string;
}

// ==========================================
// COMPANY PROFILE
// ==========================================

export async function createCompanyProfile(
  userId: string,
  data: CompanyProfileData
): Promise<void> {
  await prisma.company.upsert({
    where: { userId },
    update: {
      companyName: data.companyName,
      description: data.description,
      registrationNumber: data.registrationNumber,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      phoneNumber: data.phoneNumber,
    },
    create: {
      userId,
      companyName: data.companyName,
      description: data.description,
      registrationNumber: data.registrationNumber,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      phoneNumber: data.phoneNumber,
      isVerified: false, // Companies need admin verification
    },
  });
}

export async function getCompanyProfile(userId: string) {
  return prisma.company.findUnique({
    where: { userId },
  });
}

// ==========================================
// GUIDE PROFILE
// ==========================================

export async function createGuideProfile(
  userId: string,
  data: GuideProfileData
): Promise<void> {
  await prisma.guide.upsert({
    where: { userId },
    update: {
      bio: data.bio,
      languages: JSON.stringify(data.languages ?? []),
      yearsOfExperience: data.yearsOfExperience,
      photoUrl: data.photoUrl,
      phoneNumber: data.phoneNumber,
    },
    create: {
      userId,
      bio: data.bio,
      languages: JSON.stringify(data.languages ?? []),
      yearsOfExperience: data.yearsOfExperience,
      photoUrl: data.photoUrl,
      phoneNumber: data.phoneNumber,
      isVerified: false,
      isAvailable: true,
    },
  });
}

export async function getGuideProfile(userId: string) {
  return prisma.guide.findUnique({
    where: { userId },
  });
}

// ==========================================
// DRIVER PROFILE
// ==========================================

export async function createDriverProfile(
  userId: string,
  data: DriverProfileData
): Promise<void> {
  await prisma.driver.upsert({
    where: { userId },
    update: {
      bio: data.bio,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      licenseNumber: data.licenseNumber,
      photoUrl: data.photoUrl,
      phoneNumber: data.phoneNumber,
    },
    create: {
      userId,
      bio: data.bio,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      licenseNumber: data.licenseNumber,
      photoUrl: data.photoUrl,
      phoneNumber: data.phoneNumber,
      isVerified: false,
      isAvailable: true,
    },
  });
}

export async function getDriverProfile(userId: string) {
  return prisma.driver.findUnique({
    where: { userId },
  });
}

// ==========================================
// USER WITH PROFILES
// ==========================================

export async function findUserWithProfiles(id: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      roles: true,
      companyProfile: true,
      guideProfile: true,
      driverProfile: true,
    },
  });

  return user ? toUser(user) : null;
}

// ==========================================
// USER WITH ALL RELATIONS FOR SAFE USER
// ==========================================

export interface UserWithRelationsForSafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  emailVerified: boolean;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
  driverProfileId: string | undefined;
  guideProfileId: string | undefined;
}

/**
 * Fetches user with all relations needed for SafeUser in a single query.
 * Reduces N+1 problem by batching roles, guide, and driver profile lookups.
 */
export async function findUserWithRelationsForSafeUser(
  userId: string
): Promise<UserWithRelationsForSafeUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    include: {
      roles: { select: { role: true } },
      guideProfile: { select: { id: true } },
      driverProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    emailNotifications: user.emailNotifications,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map((r) => r.role as UserRole),
    driverProfileId: user.driverProfile?.id,
    guideProfileId: user.guideProfile?.id,
  };
}

// ==========================================
// TOUR AGENT (Sub-accounts for companies)
// ==========================================

export interface CreateTourAgentData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  parentCompanyId: string;
}

export async function createTourAgent(data: CreateTourAgentData): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      parentCompanyId: data.parentCompanyId,
      roles: {
        create: {
          role: "TOUR_AGENT" as PrismaUserRole,
        },
      },
    },
  });

  return toUser(user);
}

export async function getTourAgentsByCompany(companyUserId: string): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: {
      parentCompanyId: companyUserId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(toUser);
}

// ==========================================
// INVITATION TOKEN
// ==========================================

export async function findUserByInvitationTokenHash(tokenHash: string): Promise<User | null> {
  const user = await prisma.user.findFirst({
    where: {
      invitationToken: tokenHash,
      invitationTokenExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
  });

  return user ? toUser(user) : null;
}

export async function clearInvitationToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      invitationToken: null,
      invitationTokenExpiresAt: null,
    },
  });
}
