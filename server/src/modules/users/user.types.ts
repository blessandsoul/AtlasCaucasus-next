import type { SafeMedia } from "../media/media.types.js";

// User roles enum (matches database ENUM)
export type UserRole = 'USER' | 'COMPANY' | 'TOUR_AGENT' | 'GUIDE' | 'DRIVER' | 'ADMIN';

export interface CompanyProfile {
  id: string;
  companyName: string;
  description: string | null;
  registrationNumber: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuideProfile {
  id: string;
  bio: string | null;
  languages: string | null; // JSON string in DB
  yearsOfExperience: number | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverProfile {
  id: string;
  bio: string | null;
  vehicleType: string | null;
  vehicleCapacity: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  licenseNumber: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Full user from database
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  roles?: UserRole[];

  // Profiles
  companyProfile?: CompanyProfile | null;
  guideProfile?: GuideProfile | null;
  driverProfile?: DriverProfile | null;

  // Company hierarchy
  parentCompanyId: string | null;

  // Email verification
  emailVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;

  // Password reset
  resetPasswordToken: string | null;
  resetPasswordTokenExpiresAt: Date | null;

  // Account lockout
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

// Safe user (without sensitive fields) for API responses
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  // Roles are fetched from UserRoleAssignment
  roles: UserRole[];
  isActive: boolean;
  emailVerified: boolean;

  // Profiles
  companyProfile?: CompanyProfile | null;
  guideProfile?: GuideProfile | null;
  driverProfile?: DriverProfile | null;

  // Optional profile IDs (for frontend convenience)
  driverProfileId?: string;
  guideProfileId?: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: SafeMedia; // User avatar (single image)
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  tokenVersion?: number;
  // Email verification
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiresAt?: Date | null;
  // Password reset
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiresAt?: Date | null;
  // Account lockout
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
}
