import { redisClient } from "../../libs/redis.js";
import { logger } from "../../libs/logger.js";
import { UserPresence, OnlineUser } from "./presence.types.js";

const ONLINE_KEY_PREFIX = "user:online:";
const ONLINE_EXPIRE_SECONDS = 300; // 5 minutes

export class PresenceService {
    /**
     * Mark user as online
     * Sets a key in Redis with TTL
     */
    async setUserOnline(userId: string, connectionId: string): Promise<void> {
        const key = `${ONLINE_KEY_PREFIX}${userId}`;
        const data: OnlineUser = {
            userId,
            connectionId,
            connectedAt: new Date(),
        };

        await redisClient.setEx(key, ONLINE_EXPIRE_SECONDS, JSON.stringify(data));
        logger.debug({ userId }, "User marked as online");
    }

    /**
     * Mark user as offline
     */
    async setUserOffline(userId: string): Promise<void> {
        const key = `${ONLINE_KEY_PREFIX}${userId}`;
        await redisClient.del(key);
        logger.debug({ userId }, "User marked as offline");
    }

    /**
     * Check if user is online
     */
    async isUserOnline(userId: string): Promise<boolean> {
        const key = `${ONLINE_KEY_PREFIX}${userId}`;
        const exists = await redisClient.exists(key);
        return exists === 1;
    }

    /**
     * Get user's online status
     */
    async getUserPresence(userId: string): Promise<UserPresence> {
        const key = `${ONLINE_KEY_PREFIX}${userId}`;
        const data = await redisClient.get(key);

        if (data) {
            const onlineUser: OnlineUser = JSON.parse(data);
            return {
                userId,
                isOnline: true,
                lastSeen: new Date(onlineUser.connectedAt),
            };
        }

        return {
            userId,
            isOnline: false,
            lastSeen: new Date(), // Could fetch from DB if you track lastSeen
        };
    }

    /**
     * Get multiple users' presence status
     */
    async getMultiplePresence(userIds: string[]): Promise<UserPresence[]> {
        const results = await Promise.all(
            userIds.map((userId) => this.getUserPresence(userId))
        );
        return results;
    }

    /**
     * Heartbeat - refresh user's online status
     * Called periodically to keep user marked as online
     */
    async heartbeat(userId: string): Promise<void> {
        const key = `${ONLINE_KEY_PREFIX}${userId}`;
        const exists = await redisClient.exists(key);

        if (exists) {
            await redisClient.expire(key, ONLINE_EXPIRE_SECONDS);
            logger.debug({ userId }, "User heartbeat refreshed");
        }
    }

    /**
     * Get all currently online users
     */
    async getOnlineUsers(): Promise<string[]> {
        const keys = await redisClient.keys(`${ONLINE_KEY_PREFIX}*`);
        return keys.map((key) => key.replace(ONLINE_KEY_PREFIX, ""));
    }

    /**
     * Get count of online users
     */
    async getOnlineCount(): Promise<number> {
        const keys = await redisClient.keys(`${ONLINE_KEY_PREFIX}*`);
        return keys.length;
    }
}

export const presenceService = new PresenceService();
