import { prisma } from "../../libs/prisma.js";
import type { BookingStatus } from "@prisma/client";
import type { CreateBookingData, BookingFilters, BookingEntityType } from "./booking.types.js";

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
};

export class BookingRepository {
    /**
     * Create a new booking
     */
    async create(data: CreateBookingData) {
        return prisma.booking.create({
            data: {
                userId: data.userId,
                entityType: data.entityType,
                entityId: data.entityId,
                inquiryId: data.inquiryId,
                date: data.date,
                guests: data.guests,
                totalPrice: data.totalPrice,
                currency: data.currency ?? "GEL",
                notes: data.notes,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Find booking by ID
     */
    async findById(id: string) {
        return prisma.booking.findUnique({
            where: { id },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Get user's bookings (as customer) with pagination
     */
    async findByUser(
        userId: string,
        page: number,
        limit: number,
        filters: BookingFilters
    ) {
        const skip = (page - 1) * limit;
        const whereClause: {
            userId: string;
            status?: BookingStatus;
            entityType?: BookingEntityType;
        } = { userId };

        if (filters.status) {
            whereClause.status = filters.status;
        }
        if (filters.entityType) {
            whereClause.entityType = filters.entityType;
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: whereClause,
                include: {
                    user: { select: userSelect },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.booking.count({ where: whereClause }),
        ]);

        return { bookings, total };
    }

    /**
     * Get provider's received bookings (bookings for entities they own)
     * Finds bookings where entityId matches provider's tours/guides/drivers
     */
    async findReceivedByProvider(
        providerUserId: string,
        page: number,
        limit: number,
        filters: BookingFilters
    ) {
        const skip = (page - 1) * limit;

        // Find all entity IDs the provider owns
        const [tours, guide, driver] = await Promise.all([
            prisma.tour.findMany({
                where: { ownerId: providerUserId },
                select: { id: true },
            }),
            prisma.guide.findUnique({
                where: { userId: providerUserId },
                select: { id: true },
            }),
            prisma.driver.findUnique({
                where: { userId: providerUserId },
                select: { id: true },
            }),
        ]);

        const entityConditions: Array<{ entityType: string; entityId: { in: string[] } }> = [];

        const tourIds = tours.map(t => t.id);
        if (tourIds.length > 0) {
            entityConditions.push({ entityType: "TOUR", entityId: { in: tourIds } });
        }
        if (guide) {
            entityConditions.push({ entityType: "GUIDE", entityId: { in: [guide.id] } });
        }
        if (driver) {
            entityConditions.push({ entityType: "DRIVER", entityId: { in: [driver.id] } });
        }

        if (entityConditions.length === 0) {
            return { bookings: [], total: 0 };
        }

        const baseWhere: Record<string, unknown> = {
            OR: entityConditions,
        };

        if (filters.status) {
            baseWhere.status = filters.status;
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: baseWhere,
                include: {
                    user: { select: userSelect },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.booking.count({ where: baseWhere }),
        ]);

        return { bookings, total };
    }

    /**
     * Update booking status
     */
    async updateStatus(id: string, status: BookingStatus, cancelledAt?: Date) {
        return prisma.booking.update({
            where: { id },
            data: {
                status,
                cancelledAt,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }
}

export const bookingRepo = new BookingRepository();
