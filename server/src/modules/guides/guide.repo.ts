import { prisma } from "../../libs/prisma.js";
import type { Guide } from "@prisma/client";
import type { UpdateGuideData, GuideFilters, GuideResponse } from "./guide.types.js";
import { getMediaByEntity } from "../media/media.repo.js";

async function toGuideResponseWithMedia(guide: any): Promise<GuideResponse> {
    const media = await getMediaByEntity("guide", guide.id);
    return {
        ...guide,
        locations: guide.locations.map((gl: any) => gl.location),
        photos: media,
    };
}

export async function findById(id: string): Promise<GuideResponse | null> {
    const guide = await prisma.guide.findUnique({
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

    if (!guide) return null;

    return await toGuideResponseWithMedia(guide);
}

export async function findByUserId(userId: string): Promise<Guide | null> {
    return prisma.guide.findUnique({
        where: { userId },
    });
}

function buildGuideFilters(filters: GuideFilters): any {
    const where: any = {};

    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }

    if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
    }

    if (filters.minExperience !== undefined) {
        where.yearsOfExperience = {
            gte: filters.minExperience,
        };
    }

    // Filter by location (through junction table)
    if (filters.locationId) {
        where.locations = {
            some: {
                locationId: filters.locationId,
            },
        };
    }

    // Filter by language (array contains)
    if (filters.language) {
        where.languages = {
            array_contains: [filters.language],
        };
    }

    // Search in user's name or guide bio
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

    // Price range filter (pricePerDay)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (filters.minPrice !== undefined) {
            priceFilter.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
            priceFilter.lte = filters.maxPrice;
        }
        where.pricePerDay = priceFilter;
    }

    return where;
}

function getGuideSortOrder(sortBy?: string): any {
    switch (sortBy) {
        case 'rating':
            return { averageRating: 'desc' };
        case 'experience':
            return { yearsOfExperience: 'desc' };
        case 'price':
            return { pricePerDay: 'asc' };
        case 'price_desc':
            return { pricePerDay: 'desc' };
        case 'newest':
        default:
            return { createdAt: 'desc' };
    }
}

export async function findAll(
    filters: GuideFilters,
    page: number,
    limit: number
): Promise<{ guides: GuideResponse[]; total: number }> {
    const where = buildGuideFilters(filters);
    const orderBy = getGuideSortOrder(filters.sortBy);

    const [guides, total] = await Promise.all([
        prisma.guide.findMany({
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
        prisma.guide.count({ where }),
    ]);

    // Transform to include flat locations array and media
    const guidesWithMedia = await Promise.all(
        guides.map(toGuideResponseWithMedia)
    );

    return { guides: guidesWithMedia, total };
}

export async function update(id: string, data: UpdateGuideData): Promise<Guide> {
    return prisma.guide.update({
        where: { id },
        data: {
            bio: data.bio,
            languages: data.languages,
            yearsOfExperience: data.yearsOfExperience,
            photoUrl: data.photoUrl,
            phoneNumber: data.phoneNumber,
            isVerified: data.isVerified,
            isAvailable: data.isAvailable,
        },
    });
}

export async function deleteGuide(id: string): Promise<void> {
    // Soft delete
    await prisma.guide.update({
        where: { id },
        data: { isAvailable: false },
    });
}

export async function setLocations(guideId: string, locationIds: string[]): Promise<void> {
    // Delete existing location associations
    await prisma.guideLocation.deleteMany({
        where: { guideId },
    });

    // Create new associations
    if (locationIds.length > 0) {
        await prisma.guideLocation.createMany({
            data: locationIds.map((locationId) => ({
                guideId,
                locationId,
            })),
        });
    }
}
