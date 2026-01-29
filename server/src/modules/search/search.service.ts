import { prisma } from "../../libs/prisma.js";
import { redisClient } from "../../libs/redis.js";
import { logger } from "../../libs/logger.js";
import {
    SearchFilters,
    SearchResults,
    SearchCategory,
    SortBy,
    TourSearchResult,
    GuideSearchResult,
    DriverSearchResult,
    CompanySearchResult,
    LocationSearchResult,
} from "./search.types.js";

export class SearchService {
    private CACHE_TTL = 300; // 5 minutes

    /**
     * Main search function - aggregates all results by category
     */
    async search(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<SearchResults> {
        const startTime = Date.now();

        // Try to get from cache
        const cacheKey = this.getCacheKey(filters, page, limit);
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
            logger.debug({ cacheKey, duration: Date.now() - startTime }, "Search result from cache");
            return cached;
        }

        // Get location info if locationId provided
        let location: { id: string; name: string; region: string | null } | undefined;
        if (filters.locationId) {
            const loc = await prisma.location.findUnique({
                where: { id: filters.locationId },
                select: { id: true, name: true, region: true },
            });
            if (loc) {
                location = loc;
            }
        }

        // Determine what to search based on category
        const category = filters.category || SearchCategory.ALL;

        const [tours, guides, drivers, companies] = await Promise.all([
            category === SearchCategory.ALL || category === SearchCategory.TOURS
                ? this.searchTours(filters, page, limit)
                : { results: [], count: 0 },
            category === SearchCategory.ALL || category === SearchCategory.GUIDES
                ? this.searchGuides(filters, page, limit)
                : { results: [], count: 0 },
            category === SearchCategory.ALL || category === SearchCategory.DRIVERS
                ? this.searchDrivers(filters, page, limit)
                : { results: [], count: 0 },
            category === SearchCategory.ALL || category === SearchCategory.COMPANIES
                ? this.searchCompanies(filters, page, limit)
                : { results: [], count: 0 },
        ]);

        const results: SearchResults = {
            tours: tours.results,
            guides: guides.results,
            drivers: drivers.results,
            companies: companies.results,
            counts: {
                tours: tours.count,
                guides: guides.count,
                drivers: drivers.count,
                companies: companies.count,
                total: tours.count + guides.count + drivers.count + companies.count,
            },
            location,
        };

        // Cache result
        await this.setCache(cacheKey, results);

        logger.info(
            {
                filters,
                duration: Date.now() - startTime,
                counts: results.counts,
            },
            "Search completed"
        );

        return results;
    }

    /**
     * Search tours with filters
     */
    private async searchTours(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<{ results: TourSearchResult[]; count: number }> {
        const skip = (page - 1) * limit;
        const whereClause: any = { isActive: true };

        // Location filter
        if (filters.locationId) {
            whereClause.locations = {
                some: { locationId: filters.locationId },
            };
        }

        // Price filter
        if (filters.minPrice !== undefined) {
            whereClause.price = { ...whereClause.price, gte: filters.minPrice };
        }
        if (filters.maxPrice !== undefined) {
            whereClause.price = { ...whereClause.price, lte: filters.maxPrice };
        }

        // Text search
        if (filters.query) {
            whereClause.OR = [
                { title: { contains: filters.query } },
                { summary: { contains: filters.query } },
                { description: { contains: filters.query } },
            ];
        }

        // Build order by
        const orderBy = this.getTourOrderBy(filters.sortBy);

        const [tours, count] = await Promise.all([
            prisma.tour.findMany({
                where: whereClause,
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    company: {
                        select: {
                            id: true,
                            companyName: true,
                        },
                    },
                    locations: {
                        include: {
                            location: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.tour.count({ where: whereClause }),
        ]);

        // Format results
        const results: TourSearchResult[] = tours.map((tour) => ({
            id: tour.id,
            title: tour.title,
            summary: tour.summary,
            price: Number(tour.price),
            currency: tour.currency,
            durationMinutes: tour.durationMinutes,
            maxPeople: tour.maxPeople,
            difficulty: tour.difficulty,
            category: tour.category,
            isFeatured: tour.isFeatured,
            locations: tour.locations.map((tl) => ({
                id: tl.location.id,
                name: tl.location.name,
            })),
            owner: tour.owner,
            company: tour.company,
            averageRating: tour.averageRating ? Number(tour.averageRating) : null,
            reviewCount: tour.reviewCount,
            createdAt: tour.createdAt,
        }));

        return { results, count };
    }

    /**
     * Search guides with filters
     */
    private async searchGuides(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<{ results: GuideSearchResult[]; count: number }> {
        const skip = (page - 1) * limit;
        const whereClause: any = {};

        // Location filter
        if (filters.locationId) {
            whereClause.locations = {
                some: { locationId: filters.locationId },
            };
        }

        // Verified filter
        if (filters.verified !== undefined) {
            whereClause.isVerified = filters.verified;
        }

        // Available filter
        if (filters.available !== undefined) {
            whereClause.isAvailable = filters.available;
        }

        // Text search
        if (filters.query) {
            whereClause.OR = [
                { bio: { contains: filters.query } },
                { user: { firstName: { contains: filters.query } } },
                { user: { lastName: { contains: filters.query } } },
            ];
        }

        const orderBy = this.getProfileOrderBy(filters.sortBy);

        const [guides, count] = await Promise.all([
            prisma.guide.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    locations: {
                        include: {
                            location: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.guide.count({ where: whereClause }),
        ]);

        // Format results
        const results: GuideSearchResult[] = guides.map((guide) => ({
            id: guide.id,
            userId: guide.userId,
            user: guide.user,
            bio: guide.bio,
            languages: Array.isArray(guide.languages) ? guide.languages as string[] : [],
            yearsOfExperience: guide.yearsOfExperience,
            photoUrl: guide.photoUrl,
            isVerified: guide.isVerified,
            isAvailable: guide.isAvailable,
            locations: guide.locations.map((gl) => ({
                id: gl.location.id,
                name: gl.location.name,
            })),
            averageRating: guide.averageRating ? Number(guide.averageRating) : null,
            reviewCount: guide.reviewCount,
            createdAt: guide.createdAt,
        }));

        return { results, count };
    }

    /**
     * Search drivers with filters
     */
    private async searchDrivers(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<{ results: DriverSearchResult[]; count: number }> {
        const skip = (page - 1) * limit;
        const whereClause: any = {};

        // Location filter
        if (filters.locationId) {
            whereClause.locations = {
                some: { locationId: filters.locationId },
            };
        }

        // Verified filter
        if (filters.verified !== undefined) {
            whereClause.isVerified = filters.verified;
        }

        // Available filter
        if (filters.available !== undefined) {
            whereClause.isAvailable = filters.available;
        }

        // Text search
        if (filters.query) {
            whereClause.OR = [
                { bio: { contains: filters.query } },
                { vehicleType: { contains: filters.query } },
                { vehicleMake: { contains: filters.query } },
                { vehicleModel: { contains: filters.query } },
                { user: { firstName: { contains: filters.query } } },
                { user: { lastName: { contains: filters.query } } },
            ];
        }

        const orderBy = this.getProfileOrderBy(filters.sortBy);

        const [drivers, count] = await Promise.all([
            prisma.driver.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    locations: {
                        include: {
                            location: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.driver.count({ where: whereClause }),
        ]);

        // Format results
        const results: DriverSearchResult[] = drivers.map((driver) => ({
            id: driver.id,
            userId: driver.userId,
            user: driver.user,
            bio: driver.bio,
            vehicleType: driver.vehicleType,
            vehicleCapacity: driver.vehicleCapacity,
            vehicleMake: driver.vehicleMake,
            vehicleModel: driver.vehicleModel,
            vehicleYear: driver.vehicleYear,
            photoUrl: driver.photoUrl,
            isVerified: driver.isVerified,
            isAvailable: driver.isAvailable,
            locations: driver.locations.map((dl) => ({
                id: dl.location.id,
                name: dl.location.name,
            })),
            averageRating: driver.averageRating ? Number(driver.averageRating) : null,
            reviewCount: driver.reviewCount,
            createdAt: driver.createdAt,
        }));

        return { results, count };
    }

    /**
     * Search companies with filters
     */
    private async searchCompanies(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<{ results: CompanySearchResult[]; count: number }> {
        const skip = (page - 1) * limit;
        const whereClause: any = {};

        // Verified filter
        if (filters.verified !== undefined) {
            whereClause.isVerified = filters.verified;
        }

        // Text search
        if (filters.query) {
            whereClause.OR = [
                { companyName: { contains: filters.query } },
                { description: { contains: filters.query } },
            ];
        }

        const orderBy = this.getCompanyOrderBy(filters.sortBy);

        const [companies, count] = await Promise.all([
            prisma.company.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: { tours: true },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.company.count({ where: whereClause }),
        ]);

        // Format results
        const results: CompanySearchResult[] = companies.map((company) => ({
            id: company.id,
            userId: company.userId,
            companyName: company.companyName,
            description: company.description,
            logoUrl: company.logoUrl,
            websiteUrl: company.websiteUrl,
            isVerified: company.isVerified,
            tourCount: company._count.tours,
            averageRating: company.averageRating ? Number(company.averageRating) : null,
            reviewCount: company.reviewCount,
            createdAt: company.createdAt,
        }));

        return { results, count };
    }

    /**
     * Search locations (autocomplete)
     */
    async searchLocations(
        query: string,
        limit: number
    ): Promise<LocationSearchResult[]> {
        const locations = await prisma.location.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query } },
                    { region: { contains: query } },
                ],
            },
            select: {
                id: true,
                name: true,
                region: true,
                country: true,
            },
            take: limit,
            orderBy: { name: "asc" },
        });

        return locations;
    }

    /**
     * Get aggregated counts for a location (useful for location preview)
     */
    async getLocationStats(locationId: string): Promise<{
        tours: number;
        guides: number;
        drivers: number;
    }> {
        const cacheKey = `location_stats:${locationId}`;
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
            return cached as { tours: number; guides: number; drivers: number };
        }

        const [tours, guides, drivers] = await Promise.all([
            prisma.tourLocation.count({ where: { locationId } }),
            prisma.guideLocation.count({ where: { locationId } }),
            prisma.driverLocation.count({ where: { locationId } }),
        ]);

        const stats = { tours, guides, drivers };
        await this.setCache(cacheKey, stats);

        return stats;
    }

    /**
     * Get order by clause for tours
     */
    private getTourOrderBy(sortBy?: SortBy): any {
        switch (sortBy) {
            case SortBy.PRICE_ASC:
                return { price: "asc" };
            case SortBy.PRICE_DESC:
                return { price: "desc" };
            case SortBy.NEWEST:
                return { createdAt: "desc" };
            case SortBy.RELEVANCE:
            default:
                return [{ isFeatured: "desc" }, { createdAt: "desc" }];
        }
    }

    /**
     * Get order by clause for profiles (guides/drivers)
     */
    private getProfileOrderBy(sortBy?: SortBy): any {
        switch (sortBy) {
            case SortBy.NEWEST:
                return { createdAt: "desc" };
            case SortBy.RELEVANCE:
            default:
                return [{ isVerified: "desc" }, { createdAt: "desc" }];
        }
    }

    /**
     * Get order by clause for companies
     */
    private getCompanyOrderBy(sortBy?: SortBy): any {
        switch (sortBy) {
            case SortBy.NEWEST:
                return { createdAt: "desc" };
            case SortBy.RELEVANCE:
            default:
                return [{ isVerified: "desc" }, { createdAt: "desc" }];
        }
    }

    /**
     * Generate cache key from filters
     */
    private getCacheKey(filters: SearchFilters, page: number, limit: number): string {
        const parts = [
            "search",
            filters.locationId || "all",
            filters.category || "all",
            filters.query || "",
            filters.minPrice !== undefined ? `min${filters.minPrice}` : "",
            filters.maxPrice !== undefined ? `max${filters.maxPrice}` : "",
            filters.minRating !== undefined ? `rating${filters.minRating}` : "",
            filters.verified !== undefined ? `v${filters.verified}` : "",
            filters.available !== undefined ? `a${filters.available}` : "",
            filters.sortBy || "",
            `p${page}`,
            `l${limit}`,
        ];
        return parts.filter(Boolean).join(":");
    }

    /**
     * Get from Redis cache
     */
    private async getFromCache(key: string): Promise<any | null> {
        try {
            if (!redisClient.isOpen) {
                return null;
            }
            const cached = await redisClient.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            logger.error({ error, key }, "Failed to get from cache");
        }
        return null;
    }

    /**
     * Set Redis cache
     */
    private async setCache(key: string, data: any): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }
            await redisClient.setEx(key, this.CACHE_TTL, JSON.stringify(data));
        } catch (error) {
            logger.error({ error, key }, "Failed to set cache");
        }
    }

    /**
     * Invalidate cache for a specific location
     */
    async invalidateLocationCache(locationId: string): Promise<void> {
        try {
            if (!redisClient.isOpen) {
                return;
            }
            // Delete location stats cache
            await redisClient.del(`location_stats:${locationId}`);
            // NOTE: For full cache invalidation on data changes, 
            // consider using Redis key patterns with SCAN
            logger.debug({ locationId }, "Location cache invalidated");
        } catch (error) {
            logger.error({ error, locationId }, "Failed to invalidate cache");
        }
    }
}

export const searchService = new SearchService();
