import { NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { verifyGuideOwnership } from "../../libs/authorization.js";
import * as guideRepo from "./guide.repo.js";
import type { GuideResponse, UpdateGuideData, GuideFilters } from "./guide.types.js";
import type { UserRole } from "../users/user.types.js";
import { deleteGuidePhotos } from "../media/media.helpers.js";

export async function getGuides(
    filters: GuideFilters,
    page: number,
    limit: number
): Promise<{ guides: GuideResponse[]; total: number }> {
    // For public access, only return verified and available guides unless explicitly filtering
    // Create new object to avoid mutating input
    const effectiveFilters: GuideFilters = {
        ...filters,
        isVerified: filters.isVerified ?? true,
        isAvailable: filters.isAvailable ?? true,
    };

    return guideRepo.findAll(effectiveFilters, page, limit);
}

export async function getGuideById(id: string): Promise<GuideResponse> {
    const guide = await guideRepo.findById(id);

    if (!guide) {
        throw new NotFoundError("Guide not found", "GUIDE_NOT_FOUND");
    }

    return guide;
}

export async function getMyGuide(userId: string): Promise<GuideResponse> {
    const guide = await guideRepo.findByUserId(userId);

    if (!guide) {
        throw new NotFoundError("You don't have a guide profile", "GUIDE_NOT_FOUND");
    }

    // Get full guide response with user info, locations, and photos
    return getGuideById(guide.id);
}

export async function updateGuide(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateGuideData
): Promise<GuideResponse> {
    // Verify guide exists
    const guide = await getGuideById(id);

    // Verify ownership or admin
    const hasPermission = await verifyGuideOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this guide profile",
            "FORBIDDEN"
        );
    }

    // Non-admins cannot update isVerified - create new object to avoid mutation
    const { isVerified, ...safeData } = data;
    const updateData = userRoles.includes("ADMIN") ? data : safeData;

    // Update guide profile
    await guideRepo.update(id, updateData);

    // Update location associations if provided
    if (data.locationIds !== undefined) {
        await guideRepo.setLocations(id, data.locationIds);
    }

    // Return updated guide
    return getGuideById(id);
}

export async function deleteGuide(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify guide exists
    await getGuideById(id);

    // Verify ownership or admin
    const hasPermission = await verifyGuideOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this guide profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting guide
    await deleteGuidePhotos(id);

    await guideRepo.deleteGuide(id);
}
