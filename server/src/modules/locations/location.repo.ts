import { prisma } from "../../libs/prisma.js";
import type { Location } from "@prisma/client";
import type { CreateLocationData, UpdateLocationData, LocationFilters } from "./location.types.js";

export async function create(data: CreateLocationData): Promise<Location> {
    return prisma.location.create({
        data: {
            name: data.name,
            region: data.region,
            country: data.country || "Georgia",
            latitude: data.latitude,
            longitude: data.longitude,
        },
    });
}

export async function findById(id: string): Promise<Location | null> {
    return prisma.location.findUnique({
        where: { id },
    });
}

export async function findByName(name: string, country: string): Promise<Location | null> {
    return prisma.location.findFirst({
        where: {
            name,
            country,
        },
    });
}

export async function findAll(
    filters: LocationFilters,
    page: number,
    limit: number
): Promise<{ locations: Location[]; total: number }> {
    const where: any = {};

    if (filters.country) {
        where.country = filters.country;
    }

    if (filters.region) {
        where.region = filters.region;
    }

    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    if (filters.search) {
        where.name = {
            contains: filters.search,
        };
    }

    const [locations, total] = await Promise.all([
        prisma.location.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                name: "asc",
            },
        }),
        prisma.location.count({ where }),
    ]);

    return { locations, total };
}

export async function update(id: string, data: UpdateLocationData): Promise<Location> {
    return prisma.location.update({
        where: { id },
        data: {
            name: data.name,
            region: data.region,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            isActive: data.isActive,
        },
    });
}

export async function deleteLocation(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await prisma.location.update({
        where: { id },
        data: { isActive: false },
    });
}

export async function hardDelete(id: string): Promise<void> {
    // Hard delete - actually remove from database
    await prisma.location.delete({
        where: { id },
    });
}
