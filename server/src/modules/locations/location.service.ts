import { ConflictError, NotFoundError } from "../../libs/errors.js";
import * as locationRepo from "./location.repo.js";
import type { Location } from "@prisma/client";
import type { CreateLocationData, UpdateLocationData, LocationFilters } from "./location.types.js";

export async function createLocation(data: CreateLocationData): Promise<Location> {
    // Check if location with same name and country already exists
    const existing = await locationRepo.findByName(
        data.name,
        data.country || "Georgia"
    );

    if (existing) {
        throw new ConflictError(
            `Location "${data.name}" already exists in ${data.country || "Georgia"}`,
            "LOCATION_EXISTS"
        );
    }

    return locationRepo.create(data);
}

export async function getLocations(
    filters: LocationFilters,
    page: number,
    limit: number
): Promise<{ locations: Location[]; total: number }> {
    // For public access, only return active locations unless explicitly filtering
    if (filters.isActive === undefined) {
        filters.isActive = true;
    }

    return locationRepo.findAll(filters, page, limit);
}

export async function getLocationById(id: string): Promise<Location> {
    const location = await locationRepo.findById(id);

    if (!location) {
        throw new NotFoundError("Location not found", "LOCATION_NOT_FOUND");
    }

    return location;
}

export async function updateLocation(
    id: string,
    data: UpdateLocationData
): Promise<Location> {
    // Verify location exists
    await getLocationById(id);

    // If updating name, check for conflicts
    if (data.name && data.country) {
        const existing = await locationRepo.findByName(data.name, data.country);
        if (existing && existing.id !== id) {
            throw new ConflictError(
                `Location "${data.name}" already exists in ${data.country}`,
                "LOCATION_EXISTS"
            );
        }
    }

    return locationRepo.update(id, data);
}

export async function deleteLocation(id: string): Promise<void> {
    // Verify location exists
    await getLocationById(id);

    // Soft delete
    await locationRepo.deleteLocation(id);
}
