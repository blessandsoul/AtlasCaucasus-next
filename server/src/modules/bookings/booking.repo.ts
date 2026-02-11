import { prisma } from "../../libs/prisma.js";
import type { BookingStatus } from "@prisma/client";
import type { CreateBookingData, CreateDirectBookingData, BookingFilters, BookingEntityType } from "./booking.types.js";

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
};

/**
 * Generate a human-readable booking reference number
 * Format: BK-YYMMDD-XXXX (e.g., BK-260210-A3F2)
 */
function generateBookingRef(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${yy}${mm}${dd}-${suffix}`;
}

/**
 * Look up entity info (name, image, provider) for denormalization
 */
async function lookupEntityInfo(
    entityType: string,
    entityId: string
): Promise<{
    entityName: string | null;
    entityImage: string | null;
    providerUserId: string | null;
    providerName: string | null;
}> {
    const noResult = { entityName: null, entityImage: null, providerUserId: null, providerName: null };

    switch (entityType) {
        case "TOUR": {
            const tour = await prisma.tour.findUnique({
                where: { id: entityId },
                include: {
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (!tour) return noResult;

            // Get first media image for this tour
            const media = await prisma.media.findFirst({
                where: { entityType: "tour", entityId },
                select: { url: true },
                orderBy: { createdAt: "asc" },
            });

            return {
                entityName: tour.title,
                entityImage: media?.url ?? null,
                providerUserId: tour.owner.id,
                providerName: `${tour.owner.firstName} ${tour.owner.lastName}`,
            };
        }
        case "GUIDE": {
            const guide = await prisma.guide.findUnique({
                where: { id: entityId },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (!guide) return noResult;
            const guideName = `${guide.user.firstName} ${guide.user.lastName}`;
            return {
                entityName: guideName,
                entityImage: guide.photoUrl ?? null,
                providerUserId: guide.user.id,
                providerName: guideName,
            };
        }
        case "DRIVER": {
            const driver = await prisma.driver.findUnique({
                where: { id: entityId },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (!driver) return noResult;
            const driverName = `${driver.user.firstName} ${driver.user.lastName}`;
            return {
                entityName: driverName,
                entityImage: driver.photoUrl ?? null,
                providerUserId: driver.user.id,
                providerName: driverName,
            };
        }
        default:
            return noResult;
    }
}

export class BookingRepository {
    /**
     * Create a new booking (legacy — from inquiry acceptance)
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
     * Create a direct booking with full entity info populated
     */
    async createDirectBooking(data: CreateDirectBookingData & {
        totalPrice: number;
        currency: string;
        entityName: string | null;
        entityImage: string | null;
        providerUserId: string | null;
        providerName: string | null;
    }) {
        const referenceNumber = generateBookingRef();

        return prisma.booking.create({
            data: {
                userId: data.userId,
                entityType: data.entityType,
                entityId: data.entityId,
                status: "PENDING",
                date: data.date,
                guests: data.guests,
                totalPrice: data.totalPrice,
                currency: data.currency,
                notes: data.notes,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail,
                entityName: data.entityName,
                entityImage: data.entityImage,
                providerUserId: data.providerUserId,
                providerName: data.providerName,
                referenceNumber,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Create a booking from inquiry with entity info populated
     */
    async createFromInquiry(data: CreateBookingData & {
        entityName: string | null;
        entityImage: string | null;
        providerUserId: string | null;
        providerName: string | null;
    }) {
        const referenceNumber = generateBookingRef();

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
                status: "CONFIRMED",
                confirmedAt: new Date(),
                entityName: data.entityName,
                entityImage: data.entityImage,
                providerUserId: data.providerUserId,
                providerName: data.providerName,
                referenceNumber,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Find booking by ID with full details
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
     * Get provider's received bookings using providerUserId column
     */
    async findReceivedByProvider(
        providerUserId: string,
        page: number,
        limit: number,
        filters: BookingFilters
    ) {
        const skip = (page - 1) * limit;

        const baseWhere: Record<string, unknown> = {
            providerUserId,
        };

        if (filters.status) {
            baseWhere.status = filters.status;
        }

        // Fallback: also check entity ownership for bookings that don't have providerUserId set
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

        // Combine: providerUserId match OR entity ownership match
        const whereClause: Record<string, unknown> = {
            OR: [
                { providerUserId },
                ...(entityConditions.length > 0 ? [{ OR: entityConditions }] : []),
            ],
        };

        if (filters.status) {
            whereClause.AND = [{ status: filters.status }];
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

    /**
     * Confirm a booking — set status to CONFIRMED + confirmedAt
     */
    async confirmBooking(id: string, providerNotes?: string) {
        return prisma.booking.update({
            where: { id },
            data: {
                status: "CONFIRMED",
                confirmedAt: new Date(),
                providerNotes: providerNotes ?? undefined,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Decline a booking — set status to DECLINED + declinedAt + reason
     */
    async declineBooking(id: string, declinedReason: string) {
        return prisma.booking.update({
            where: { id },
            data: {
                status: "DECLINED",
                declinedAt: new Date(),
                declinedReason,
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Complete a booking — set status to COMPLETED + completedAt
     */
    async completeBooking(id: string) {
        return prisma.booking.update({
            where: { id },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
            },
            include: {
                user: { select: userSelect },
            },
        });
    }

    /**
     * Count bookings for a specific tour and date (PENDING + CONFIRMED only)
     */
    async countBookedGuests(entityId: string, date: Date): Promise<number> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const result = await prisma.booking.aggregate({
            where: {
                entityId,
                status: { in: ["PENDING", "CONFIRMED"] },
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            _sum: {
                guests: true,
            },
        });

        return result._sum.guests ?? 0;
    }

    /**
     * Find all PENDING bookings older than a given cutoff
     */
    async findExpiredPendingBookings(cutoffDate: Date) {
        return prisma.booking.findMany({
            where: {
                status: "PENDING",
                createdAt: { lt: cutoffDate },
            },
            include: {
                user: { select: userSelect },
            },
        });
    }
}

export const bookingRepo = new BookingRepository();
export { lookupEntityInfo, generateBookingRef };
