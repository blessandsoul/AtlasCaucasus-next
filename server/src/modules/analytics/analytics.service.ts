import { analyticsRepo } from "./analytics.repo.js";
import { redisClient, isRedisConnected } from "../../libs/redis.js";
import { logger } from "../../libs/logger.js";
import { ForbiddenError } from "../../libs/errors.js";
import type { ProviderAnalytics, AnalyticsEntityType, ViewCountResult } from "./analytics.types.js";
import type { UserRole } from "../users/user.types.js";

const PROVIDER_ROLES: UserRole[] = ["COMPANY", "GUIDE", "DRIVER"];

// Redis key patterns
const VIEW_KEY_PREFIX = "views";
const VIEW_DEDUP_PREFIX = "view_dedup";
const DEDUP_TTL_SECONDS = 3600; // 1 hour dedup window

export class AnalyticsService {
    /**
     * Get analytics overview for the authenticated provider.
     */
    async getProviderAnalytics(userId: string, roles: UserRole[]): Promise<ProviderAnalytics> {
        // Ensure user is a provider
        const isProvider = roles.some((r) => PROVIDER_ROLES.includes(r));
        if (!isProvider) {
            throw new ForbiddenError(
                "Only providers can access analytics",
                "NOT_A_PROVIDER"
            );
        }

        const entityMap = await analyticsRepo.getOwnedEntityIds(userId);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            views,
            inquiriesTotal,
            inquiriesLast30,
            favoritesCount,
            bookingsTotal,
            bookingsLast30,
            ratings,
        ] = await Promise.all([
            this.getAggregateViewCounts(entityMap),
            analyticsRepo.countInquiries(userId),
            analyticsRepo.countInquiries(userId, thirtyDaysAgo),
            analyticsRepo.countFavorites(entityMap),
            analyticsRepo.countBookings(entityMap),
            analyticsRepo.countBookings(entityMap, thirtyDaysAgo),
            analyticsRepo.getAggregateRatings(entityMap),
        ]);

        const responseRate = inquiriesTotal.total > 0
            ? Number((inquiriesTotal.responded / inquiriesTotal.total).toFixed(2))
            : 0;

        logger.info({ userId }, "Provider analytics retrieved");

        return {
            views: {
                total: views.total,
                last30Days: views.last30Days,
            },
            inquiries: {
                total: inquiriesTotal.total,
                last30Days: inquiriesLast30.total,
                responseRate,
            },
            favorites: {
                total: favoritesCount,
            },
            bookings: {
                total: bookingsTotal,
                last30Days: bookingsLast30,
            },
            avgRating: ratings.avgRating,
            reviewCount: ratings.reviewCount,
        };
    }

    /**
     * Track a page view using Redis counters.
     * Deduplicates by userId + entityId within a 1-hour window.
     */
    async trackView(
        entityType: AnalyticsEntityType,
        entityId: string,
        userId: string | undefined,
        userAgent: string | undefined
    ): Promise<void> {
        if (!isRedisConnected()) {
            logger.warn("Redis not connected, skipping view tracking");
            return;
        }

        // Skip bot traffic (basic User-Agent check)
        if (userAgent && /bot|crawler|spider|slurp|wget|curl/i.test(userAgent)) {
            return;
        }

        // Dedup: if authenticated user viewed this entity within 1 hour, skip
        if (userId) {
            const dedupKey = `${VIEW_DEDUP_PREFIX}:${userId}:${entityType}:${entityId}`;
            const exists = await redisClient.get(dedupKey);
            if (exists) return;
            await redisClient.setEx(dedupKey, DEDUP_TTL_SECONDS, "1");
        }

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const dailyKey = `${VIEW_KEY_PREFIX}:${entityType}:${entityId}:${today}`;
        const totalKey = `${VIEW_KEY_PREFIX}:${entityType}:${entityId}:total`;

        await Promise.all([
            redisClient.incr(dailyKey),
            redisClient.expire(dailyKey, 90 * 86400), // 90-day TTL on daily keys
            redisClient.incr(totalKey),
        ]);
    }

    /**
     * Get view counts for a single entity from Redis.
     */
    async getViewCounts(entityType: string, entityId: string): Promise<ViewCountResult> {
        if (!isRedisConnected()) {
            return { total: 0, last30Days: 0 };
        }

        const totalKey = `${VIEW_KEY_PREFIX}:${entityType}:${entityId}:total`;
        const totalStr = await redisClient.get(totalKey);
        const total = totalStr ? parseInt(totalStr, 10) : 0;

        // Sum last 30 daily keys
        const dailyKeys: string[] = [];
        const now = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().slice(0, 10);
            dailyKeys.push(`${VIEW_KEY_PREFIX}:${entityType}:${entityId}:${dateStr}`);
        }

        const dailyValues = await redisClient.mGet(dailyKeys);
        const last30Days = dailyValues.reduce((sum, val) => sum + (val ? parseInt(val, 10) : 0), 0);

        return { total, last30Days };
    }

    /**
     * Aggregate view counts across all entities owned by a provider.
     */
    private async getAggregateViewCounts(
        entityMap: Record<AnalyticsEntityType, string[]>
    ): Promise<ViewCountResult> {
        if (!isRedisConnected()) {
            return { total: 0, last30Days: 0 };
        }

        let totalViews = 0;
        let last30DaysViews = 0;

        for (const [entityType, ids] of Object.entries(entityMap)) {
            for (const id of ids) {
                const counts = await this.getViewCounts(entityType, id);
                totalViews += counts.total;
                last30DaysViews += counts.last30Days;
            }
        }

        return { total: totalViews, last30Days: last30DaysViews };
    }
}

export const analyticsService = new AnalyticsService();
