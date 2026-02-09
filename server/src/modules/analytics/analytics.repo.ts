import { prisma } from "../../libs/prisma.js";
import type { ReviewTargetType } from "@prisma/client";
import type { AnalyticsEntityType } from "./analytics.types.js";

export class AnalyticsRepository {
    /**
     * Get all entity IDs owned by a user based on their roles.
     * Returns a map of entityType -> entityIds.
     */
    async getOwnedEntityIds(userId: string): Promise<Record<AnalyticsEntityType, string[]>> {
        const result: Record<AnalyticsEntityType, string[]> = {
            TOUR: [],
            GUIDE: [],
            DRIVER: [],
            COMPANY: [],
        };

        const [tours, guide, driver, company] = await Promise.all([
            prisma.tour.findMany({
                where: { ownerId: userId, isActive: true },
                select: { id: true },
            }),
            prisma.guide.findFirst({
                where: { userId },
                select: { id: true },
            }),
            prisma.driver.findFirst({
                where: { userId },
                select: { id: true },
            }),
            prisma.company.findFirst({
                where: { userId },
                select: { id: true },
            }),
        ]);

        result.TOUR = tours.map((t) => t.id);
        if (guide) result.GUIDE = [guide.id];
        if (driver) result.DRIVER = [driver.id];
        if (company) result.COMPANY = [company.id];

        return result;
    }

    /**
     * Count inquiries targeting any of the user's entities
     */
    async countInquiries(
        userId: string,
        since?: Date
    ): Promise<{ total: number; responded: number }> {
        const whereClause: Record<string, unknown> = {
            recipientId: userId,
        };
        if (since) {
            whereClause.createdAt = { gte: since };
        }

        const [total, responded] = await Promise.all([
            prisma.inquiryResponse.count({ where: whereClause }),
            prisma.inquiryResponse.count({
                where: {
                    ...whereClause,
                    status: { in: ["RESPONDED", "ACCEPTED", "DECLINED"] },
                },
            }),
        ]);

        return { total, responded };
    }

    /**
     * Count favorites across all of a user's owned entities
     */
    async countFavorites(entityMap: Record<AnalyticsEntityType, string[]>): Promise<number> {
        const conditions: Array<{ entityType: string; entityId: { in: string[] } }> = [];

        for (const [entityType, ids] of Object.entries(entityMap)) {
            if (ids.length > 0) {
                conditions.push({ entityType, entityId: { in: ids } });
            }
        }

        if (conditions.length === 0) return 0;

        return prisma.favorite.count({
            where: { OR: conditions },
        });
    }

    /**
     * Count bookings for the user's owned entities
     */
    async countBookings(
        entityMap: Record<AnalyticsEntityType, string[]>,
        since?: Date
    ): Promise<number> {
        const conditions: Array<{ entityType: string; entityId: { in: string[] } }> = [];

        for (const [entityType, ids] of Object.entries(entityMap)) {
            if (ids.length > 0) {
                conditions.push({ entityType, entityId: { in: ids } });
            }
        }

        if (conditions.length === 0) return 0;

        const whereClause: Record<string, unknown> = { OR: conditions };
        if (since) {
            whereClause.createdAt = { gte: since };
        }

        return prisma.booking.count({ where: whereClause });
    }

    /**
     * Get average rating and review count across all entities
     */
    async getAggregateRatings(
        entityMap: Record<AnalyticsEntityType, string[]>
    ): Promise<{ avgRating: number | null; reviewCount: number }> {
        const conditions: Array<{ targetType: ReviewTargetType; targetId: { in: string[] } }> = [];

        for (const [entityType, ids] of Object.entries(entityMap)) {
            if (ids.length > 0) {
                conditions.push({ targetType: entityType as ReviewTargetType, targetId: { in: ids } });
            }
        }

        if (conditions.length === 0) return { avgRating: null, reviewCount: 0 };

        const result = await prisma.review.aggregate({
            where: { OR: conditions },
            _avg: { rating: true },
            _count: { _all: true },
        });

        return {
            avgRating: result._avg?.rating ?? null,
            reviewCount: result._count._all,
        };
    }
}

export const analyticsRepo = new AnalyticsRepository();
