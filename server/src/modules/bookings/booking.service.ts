import { BookingStatus } from "@prisma/client";
import { bookingRepo } from "./booking.repo.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";
import { prisma } from "../../libs/prisma.js";
import type { CreateBookingData, BookingFilters } from "./booking.types.js";

export class BookingService {
    /**
     * Create a booking (typically called internally when inquiry is accepted)
     */
    async createBooking(data: CreateBookingData) {
        const booking = await bookingRepo.create(data);
        logger.info(
            { bookingId: booking.id, userId: data.userId, entityType: data.entityType },
            "Booking created"
        );
        return booking;
    }

    /**
     * Get user's bookings (as customer)
     */
    async getUserBookings(
        userId: string,
        page: number,
        limit: number,
        filters: BookingFilters
    ) {
        const { bookings, total } = await bookingRepo.findByUser(userId, page, limit, filters);
        return { items: bookings, totalItems: total };
    }

    /**
     * Get provider's received bookings
     */
    async getReceivedBookings(
        providerUserId: string,
        page: number,
        limit: number,
        filters: BookingFilters
    ) {
        const { bookings, total } = await bookingRepo.findReceivedByProvider(
            providerUserId,
            page,
            limit,
            filters
        );
        return { items: bookings, totalItems: total };
    }

    /**
     * Cancel a booking (by the user who made it)
     */
    async cancelBooking(bookingId: string, userId: string) {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found", "BOOKING_NOT_FOUND");
        }

        if (booking.userId !== userId) {
            throw new ForbiddenError("You can only cancel your own bookings");
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new BadRequestError("Booking is already cancelled", "BOOKING_ALREADY_CANCELLED");
        }

        if (booking.status === BookingStatus.COMPLETED) {
            throw new BadRequestError("Cannot cancel a completed booking", "BOOKING_COMPLETED");
        }

        const updated = await bookingRepo.updateStatus(
            bookingId,
            BookingStatus.CANCELLED,
            new Date()
        );

        logger.info({ bookingId, userId }, "Booking cancelled");
        return updated;
    }

    /**
     * Mark a booking as completed (by the provider)
     */
    async completeBooking(bookingId: string, providerUserId: string) {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found", "BOOKING_NOT_FOUND");
        }

        // Verify the provider owns the entity
        const isOwner = await this.verifyEntityOwnership(
            booking.entityType,
            booking.entityId,
            providerUserId
        );

        if (!isOwner) {
            throw new ForbiddenError("You do not own this booking's entity");
        }

        if (booking.status === BookingStatus.COMPLETED) {
            throw new BadRequestError("Booking is already completed", "BOOKING_ALREADY_COMPLETED");
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new BadRequestError("Cannot complete a cancelled booking", "BOOKING_CANCELLED");
        }

        const updated = await bookingRepo.updateStatus(bookingId, BookingStatus.COMPLETED);

        logger.info({ bookingId, providerUserId }, "Booking completed");
        return updated;
    }

    /**
     * Verify that a user owns the entity referenced by a booking
     */
    private async verifyEntityOwnership(
        entityType: string,
        entityId: string,
        userId: string
    ): Promise<boolean> {
        switch (entityType) {
            case "TOUR": {
                const tour = await prisma.tour.findUnique({
                    where: { id: entityId },
                    select: { ownerId: true },
                });
                return tour?.ownerId === userId;
            }
            case "GUIDE": {
                const guide = await prisma.guide.findUnique({
                    where: { id: entityId },
                    select: { userId: true },
                });
                return guide?.userId === userId;
            }
            case "DRIVER": {
                const driver = await prisma.driver.findUnique({
                    where: { id: entityId },
                    select: { userId: true },
                });
                return driver?.userId === userId;
            }
            default:
                return false;
        }
    }
}

export const bookingService = new BookingService();
