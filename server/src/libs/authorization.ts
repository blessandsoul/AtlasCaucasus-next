import type { JwtUser } from "../modules/auth/auth.types.js";
import type { UserRole } from "../modules/users/user.types.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { getTourById } from "../modules/tours/tour.repo.js";
import { findById as getCompanyById } from "../modules/companies/company.repo.js";
import { findById as getGuideById } from "../modules/guides/guide.repo.js";
import { findById as getDriverById } from "../modules/drivers/driver.repo.js";

// ==========================================
// ROLE CHECK HELPERS
// ==========================================

export function isAdmin(user: JwtUser): boolean {
  return user.roles.includes("ADMIN");
}

export function isCompany(user: JwtUser): boolean {
  return user.roles.includes("COMPANY");
}

export function isGuide(user: JwtUser): boolean {
  return user.roles.includes("GUIDE");
}

export function isDriver(user: JwtUser): boolean {
  return user.roles.includes("DRIVER");
}

export function hasAnyRole(user: JwtUser, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function hasAllRoles(user: JwtUser, roles: UserRole[]): boolean {
  return roles.every((role) => user.roles.includes(role));
}

// ==========================================
// AUTHORIZATION CONTEXT
// ==========================================

export interface AuthContext {
  user: JwtUser;
  isAdmin: boolean;
  isCompany: boolean;
  isGuide: boolean;
  isDriver: boolean;
}

export function createAuthContext(user: JwtUser): AuthContext {
  return {
    user,
    isAdmin: isAdmin(user),
    isCompany: isCompany(user),
    isGuide: isGuide(user),
    isDriver: isDriver(user),
  };
}

// ==========================================
// TOUR AUTHORIZATION
// ==========================================

export async function assertCanModifyTour(
  user: JwtUser,
  tourId: string
): Promise<void> {
  const tour = await getTourById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }
  if (tour.ownerId !== user.id && !isAdmin(user)) {
    throw new ForbiddenError("You can only modify your own tours", "NOT_TOUR_OWNER");
  }
}

export async function canModifyTour(user: JwtUser, tourId: string): Promise<boolean> {
  try {
    await assertCanModifyTour(user, tourId);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// COMPANY AUTHORIZATION
// ==========================================

export async function assertCanModifyCompany(
  user: JwtUser,
  companyId: string
): Promise<void> {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
  }
  if (company.userId !== user.id && !isAdmin(user)) {
    throw new ForbiddenError("You can only modify your own company", "NOT_COMPANY_OWNER");
  }
}

export async function canModifyCompany(user: JwtUser, companyId: string): Promise<boolean> {
  try {
    await assertCanModifyCompany(user, companyId);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// GUIDE AUTHORIZATION
// ==========================================

export async function assertCanModifyGuide(
  user: JwtUser,
  guideId: string
): Promise<void> {
  const guide = await getGuideById(guideId);
  if (!guide) {
    throw new NotFoundError("Guide profile not found", "GUIDE_NOT_FOUND");
  }
  if (guide.userId !== user.id && !isAdmin(user)) {
    throw new ForbiddenError("You can only modify your own guide profile", "NOT_GUIDE_OWNER");
  }
}

export async function canModifyGuide(user: JwtUser, guideId: string): Promise<boolean> {
  try {
    await assertCanModifyGuide(user, guideId);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// DRIVER AUTHORIZATION
// ==========================================

export async function assertCanModifyDriver(
  user: JwtUser,
  driverId: string
): Promise<void> {
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError("Driver profile not found", "DRIVER_NOT_FOUND");
  }
  if (driver.userId !== user.id && !isAdmin(user)) {
    throw new ForbiddenError("You can only modify your own driver profile", "NOT_DRIVER_OWNER");
  }
}

export async function canModifyDriver(user: JwtUser, driverId: string): Promise<boolean> {
  try {
    await assertCanModifyDriver(user, driverId);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// USER AUTHORIZATION
// ==========================================

export function assertCanModifyUser(currentUser: JwtUser, targetUserId: string): void {
  if (targetUserId !== currentUser.id && !isAdmin(currentUser)) {
    throw new ForbiddenError("You can only modify your own account", "NOT_USER_OWNER");
  }
}

export function canModifyUser(currentUser: JwtUser, targetUserId: string): boolean {
  return targetUserId === currentUser.id || isAdmin(currentUser);
}

// ==========================================
// ADMIN-ONLY AUTHORIZATION
// ==========================================

export function assertIsAdmin(user: JwtUser): void {
  if (!isAdmin(user)) {
    throw new ForbiddenError("This action requires admin privileges", "ADMIN_REQUIRED");
  }
}

export function assertHasRole(user: JwtUser, role: UserRole): void {
  if (!user.roles.includes(role)) {
    throw new ForbiddenError("This action requires the " + role + " role", role + "_REQUIRED");
  }
}

export function assertHasAnyRole(user: JwtUser, roles: UserRole[]): void {
  if (!hasAnyRole(user, roles)) {
    throw new ForbiddenError("This action requires one of: " + roles.join(", "), "INSUFFICIENT_ROLE");
  }
}

// ==========================================
// LEGACY VERIFICATION FUNCTIONS
// These take userId and roles separately (backward compatibility)
// ==========================================

/**
 * Verify company ownership - returns boolean
 * Used by services that need to check ownership without throwing
 */
export async function verifyCompanyOwnership(
  companyId: string,
  userId: string,
  userRoles: UserRole[]
): Promise<boolean> {
  if (userRoles.includes("ADMIN")) {
    return true;
  }

  const company = await getCompanyById(companyId);
  if (!company) {
    return false;
  }

  return company.userId === userId;
}

/**
 * Verify guide ownership - returns boolean
 * Used by services that need to check ownership without throwing
 */
export async function verifyGuideOwnership(
  guideId: string,
  userId: string,
  userRoles: UserRole[]
): Promise<boolean> {
  if (userRoles.includes("ADMIN")) {
    return true;
  }

  const guide = await getGuideById(guideId);
  if (!guide) {
    return false;
  }

  return guide.userId === userId;
}

/**
 * Verify driver ownership - returns boolean
 * Used by services that need to check ownership without throwing
 */
export async function verifyDriverOwnership(
  driverId: string,
  userId: string,
  userRoles: UserRole[]
): Promise<boolean> {
  if (userRoles.includes("ADMIN")) {
    return true;
  }

  const driver = await getDriverById(driverId);
  if (!driver) {
    return false;
  }

  return driver.userId === userId;
}

/**
 * Verify tour ownership - returns boolean
 * Used by services that need to check ownership without throwing
 */
export async function verifyTourOwnership(
  tourId: string,
  userId: string,
  userRoles: UserRole[]
): Promise<boolean> {
  if (userRoles.includes("ADMIN")) {
    return true;
  }

  const tour = await getTourById(tourId);
  if (!tour) {
    return false;
  }

  return tour.ownerId === userId;
}

// ==========================================
// MEDIA ENTITY OWNERSHIP
// ==========================================

/**
 * Media entity types that can have media attached
 */
export type MediaEntityType = "tour" | "company" | "guide" | "driver" | "user" | "guide-avatar" | "driver-avatar" | "blog";

/**
 * Verify ownership of the entity that media is attached to
 * This checks the ENTITY ownership, not who uploaded the media
 * @param entityType - Type of entity the media is attached to
 * @param entityId - ID of the entity
 * @param userId - ID of user to check ownership for
 * @param userRoles - User's roles
 * @returns true if user owns the entity or is admin
 */
export async function verifyMediaEntityOwnership(
  entityType: MediaEntityType,
  entityId: string,
  userId: string,
  userRoles: UserRole[]
): Promise<boolean> {
  // Admins can modify any media
  if (userRoles.includes("ADMIN")) {
    return true;
  }

  switch (entityType) {
    case "tour": {
      const tour = await getTourById(entityId);
      if (!tour) return false;
      return tour.ownerId === userId;
    }

    case "company": {
      const company = await getCompanyById(entityId);
      if (!company) return false;
      return company.userId === userId;
    }

    case "guide":
    case "guide-avatar": {
      const guide = await getGuideById(entityId);
      if (!guide) return false;
      return guide.userId === userId;
    }

    case "driver":
    case "driver-avatar": {
      const driver = await getDriverById(entityId);
      if (!driver) return false;
      return driver.userId === userId;
    }

    case "user": {
      // For user entities, the entityId IS the userId
      return entityId === userId;
    }

    case "blog": {
      // Blog media is admin-only (already checked above)
      return false;
    }

    default:
      // Unknown entity type - deny access
      return false;
  }
}

/**
 * Assert that user can modify media attached to an entity
 * Throws ForbiddenError if not authorized
 * @param entityType - Type of entity the media is attached to
 * @param entityId - ID of the entity
 * @param user - Current user
 */
export async function assertCanModifyMediaEntity(
  entityType: MediaEntityType,
  entityId: string,
  user: JwtUser
): Promise<void> {
  const canModify = await verifyMediaEntityOwnership(
    entityType,
    entityId,
    user.id,
    user.roles
  );

  if (!canModify) {
    throw new ForbiddenError(
      "You can only modify media for your own entities",
      "NOT_ENTITY_OWNER"
    );
  }
}
