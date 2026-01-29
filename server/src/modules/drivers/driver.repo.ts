import { prisma } from "../../libs/prisma.js";
import type { Driver } from "@prisma/client";
import type { UpdateDriverData, DriverFilters, DriverResponse } from "./driver.types.js";
import { getMediaByEntity } from "../media/media.repo.js";

async function toDriverResponseWithMedia(driver: any): Promise<DriverResponse> {
    const media = await getMediaByEntity("driver", driver.id);
    return {
        ...driver,
        locations: driver.locations.map((dl: any) => dl.location),
        photos: media,
    };
}

export async function findById(id: string): Promise<DriverResponse | null> {
    const driver = await prisma.driver.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    emailVerified: true,
                },
            },
            locations: {
                include: {
                    location: true,
                },
            },
        },
    });

    if (!driver) return null;

    return await toDriverResponseWithMedia(driver);
}

export async function findByUserId(userId: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
        where: { userId },
    });
}

function buildDriverFilters(filters: DriverFilters): any {
    const where: any = {};

    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }

    if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
    }

    // Vehicle type filter
    if (filters.vehicleType) {
        where.vehicleType = {
            contains: filters.vehicleType,
        };
    }

    if (filters.minCapacity !== undefined) {
        where.vehicleCapacity = {
            gte: filters.minCapacity,
        };
    }

    if (filters.locationId) {
        where.locations = {
            some: {
                locationId: filters.locationId,
            },
        };
    }

    // Search in user's name or driver bio
    if (filters.search) {
        where.OR = [
            {
                bio: {
                    contains: filters.search,
                },
            },
            {
                user: {
                    OR: [
                        {
                            firstName: {
                                contains: filters.search,
                            },
                        },
                        {
                            lastName: {
                                contains: filters.search,
                            },
                        },
                    ],
                },
            },
        ];
    }

    // Minimum rating filter
    if (filters.minRating !== undefined) {
        where.averageRating = {
            gte: filters.minRating,
        };
    }

    return where;
}

function getDriverSortOrder(sortBy?: string): any {
    switch (sortBy) {
        case 'rating':
            return { averageRating: 'desc' };
        case 'capacity':
            return { vehicleCapacity: 'desc' };
        case 'newest':
        default:
            return { createdAt: 'desc' };
    }
}

export async function findAll(
    filters: DriverFilters,
    page: number,
    limit: number
): Promise<{ drivers: DriverResponse[]; total: number }> {
    const where = buildDriverFilters(filters);
    const orderBy = getDriverSortOrder(filters.sortBy);

    const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        emailVerified: true,
                    },
                },
                locations: {
                    include: {
                        location: true,
                    },
                },
            },
            orderBy,
        }),
        prisma.driver.count({ where }),
    ]);

    // Transform to include flat locations array and media
    const driversWithMedia = await Promise.all(
        drivers.map(toDriverResponseWithMedia)
    );

    return { drivers: driversWithMedia, total };
}

export async function update(id: string, data: UpdateDriverData): Promise<Driver> {
    return prisma.driver.update({
        where: { id },
        data: {
            bio: data.bio,
            vehicleType: data.vehicleType,
            vehicleCapacity: data.vehicleCapacity,
            vehicleMake: data.vehicleMake,
            vehicleModel: data.vehicleModel,
            vehicleYear: data.vehicleYear,
            licenseNumber: data.licenseNumber,
            photoUrl: data.photoUrl,
            phoneNumber: data.phoneNumber,
            isVerified: data.isVerified,
            isAvailable: data.isAvailable,
        },
    });
}

export async function deleteDriver(id: string): Promise<void> {
    await prisma.driver.update({
        where: { id },
        data: { isAvailable: false },
    });
}

export async function setLocations(driverId: string, locationIds: string[]): Promise<void> {
    await prisma.driverLocation.deleteMany({
        where: { driverId },
    });

    if (locationIds.length > 0) {
        await prisma.driverLocation.createMany({
            data: locationIds.map((locationId) => ({
                driverId,
                locationId,
            })),
        });
    }
}
