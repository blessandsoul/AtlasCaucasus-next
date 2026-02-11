import { NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { verifyDriverOwnership } from "../../libs/authorization.js";
import * as driverRepo from "./driver.repo.js";
import type { DriverResponse, UpdateDriverData, DriverFilters } from "./driver.types.js";
import type { UserRole } from "../users/user.types.js";
import { deleteDriverPhotos } from "../media/media.helpers.js";
import { cacheGet, cacheSet, cacheDeletePattern } from "../../libs/cache.js";

export async function getDrivers(
    filters: DriverFilters,
    page: number,
    limit: number
): Promise<{ drivers: DriverResponse[]; total: number }> {
    // Create new object to avoid mutating input
    const effectiveFilters: DriverFilters = {
        ...filters,
        isVerified: filters.isVerified ?? true,
        isAvailable: filters.isAvailable ?? true,
    };

    const cacheKey = `drivers:list:${JSON.stringify(effectiveFilters)}:p${page}:l${limit}`;
    const cached = await cacheGet<{ drivers: DriverResponse[]; total: number }>(cacheKey);
    if (cached) {
        return cached;
    }

    const result = await driverRepo.findAll(effectiveFilters, page, limit);
    await cacheSet(cacheKey, result, 300);

    return result;
}

export async function getDriverById(id: string): Promise<DriverResponse> {
    const driver = await driverRepo.findById(id);

    if (!driver) {
        throw new NotFoundError("Driver not found", "DRIVER_NOT_FOUND");
    }

    return driver;
}

export async function getMyDriver(userId: string): Promise<DriverResponse> {
    const driver = await driverRepo.findByUserId(userId);

    if (!driver) {
        throw new NotFoundError("You don't have a driver profile", "DRIVER_NOT_FOUND");
    }

    // Get full driver response with user info, locations, and photos
    return getDriverById(driver.id);
}

export async function updateDriver(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateDriverData
): Promise<DriverResponse> {
    await getDriverById(id);

    const hasPermission = await verifyDriverOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this driver profile",
            "FORBIDDEN"
        );
    }

    // Non-admins cannot update isVerified - create new object to avoid mutation
    const { isVerified, ...safeData } = data;
    const updateData = userRoles.includes("ADMIN") ? data : safeData;

    await driverRepo.update(id, updateData);

    if (data.locationIds !== undefined) {
        await driverRepo.setLocations(id, data.locationIds);
    }

    cacheDeletePattern("drivers:list:*").catch(() => {});
    cacheDeletePattern("search:*").catch(() => {});

    return getDriverById(id);
}

export async function deleteDriver(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    await getDriverById(id);

    const hasPermission = await verifyDriverOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this driver profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting driver
    await deleteDriverPhotos(id);

    await driverRepo.deleteDriver(id);

    cacheDeletePattern("drivers:list:*").catch(() => {});
    cacheDeletePattern("search:*").catch(() => {});
}
