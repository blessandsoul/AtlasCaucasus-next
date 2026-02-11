import { BookingStatus } from "@prisma/client";
import { bookingRepo, lookupEntityInfo } from "./booking.repo.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";
import { prisma } from "../../libs/prisma.js";
import { notificationService } from "../notifications/notification.service.js";
import {
    sendNewBookingRequestEmail,
    sendBookingConfirmedNotificationEmail,
    sendBookingDeclinedEmail,
    sendBookingCancelledEmail,
    sendBookingCompletedEmail,
} from "../../libs/email.js";
import type {
    CreateBookingData,
    CreateDirectBookingData,
    ConfirmBookingData,
    DeclineBookingData,
    BookingFilters,
    AvailabilityResult,
} from "./booking.types.js";

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
     * Create a direct booking (customer-initiated)
     */
    async createDirectBooking(data: CreateDirectBookingData) {
        // 1. Validate entity exists and is active
        const entity = await this.getEntityDetails(data.entityType, data.entityId);

        if (!entity) {
            throw new NotFoundError(
                `${data.entityType.charAt(0) + data.entityType.slice(1).toLowerCase()} not found`,
                `${data.entityType}_NOT_FOUND`
            );
        }

        if (!entity.isActive) {
            throw new BadRequestError(
                "This listing is no longer available",
                "ENTITY_INACTIVE"
            );
        }

        // 2. Block self-booking
        if (entity.ownerId === data.userId) {
            throw new BadRequestError(
                "You cannot book your own listing",
                "SELF_BOOKING"
            );
        }

        // 3. For TOUR: check availability
        let totalPrice = 0;
        let currency = "GEL";

        if (data.entityType === "TOUR") {
            const availability = await this.checkTourAvailability(
                data.entityId,
                data.date,
                data.guests
            );

            if (!availability.available) {
                throw new BadRequestError(
                    availability.reason ?? "Not enough spots available for this date",
                    "INSUFFICIENT_AVAILABILITY"
                );
            }

            // Calculate price
            totalPrice = Number(entity.price) * data.guests;
            currency = entity.currency ?? "GEL";
        }

        // 4. Look up entity info for denormalization
        const entityInfo = await lookupEntityInfo(data.entityType, data.entityId);

        // 5. Create booking
        const booking = await bookingRepo.createDirectBooking({
            ...data,
            totalPrice,
            currency,
            entityName: entityInfo.entityName,
            entityImage: entityInfo.entityImage,
            providerUserId: entityInfo.providerUserId,
            providerName: entityInfo.providerName,
        });

        // 6. Notify provider
        const customerName = `${booking.user.firstName} ${booking.user.lastName}`;

        if (entityInfo.providerUserId) {
            notificationService.notifyBookingPending(
                entityInfo.providerUserId,
                booking.id,
                customerName,
                entityInfo.entityName ?? data.entityType
            ).catch((err) => {
                logger.error({ err, bookingId: booking.id }, "Failed to send booking pending notification");
            });

            // Send email to provider
            const provider = await prisma.user.findUnique({
                where: { id: entityInfo.providerUserId },
                select: { email: true, firstName: true, emailNotifications: true },
            });

            if (provider && provider.emailNotifications !== false) {
                sendNewBookingRequestEmail(
                    provider.email,
                    provider.firstName,
                    customerName,
                    entityInfo.entityName ?? data.entityType,
                    booking.date ? booking.date.toISOString() : null,
                    booking.guests,
                    booking.referenceNumber
                ).catch((err) => {
                    logger.error({ err, bookingId: booking.id }, "Failed to send new booking request email");
                });
            }
        }

        logger.info(
            { bookingId: booking.id, userId: data.userId, entityType: data.entityType, referenceNumber: booking.referenceNumber },
            "Direct booking created"
        );

        return booking;
    }

    /**
     * Get a single booking by ID with authorization
     */
    async getBookingById(bookingId: string, userId: string) {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found", "BOOKING_NOT_FOUND");
        }

        // Authorize: must be the customer or the provider
        const isCustomer = booking.userId === userId;
        const isProvider = booking.providerUserId === userId;

        if (!isCustomer && !isProvider) {
            // Fallback: check entity ownership for old bookings without providerUserId
            const isOwner = await this.verifyEntityOwnership(
                booking.entityType,
                booking.entityId,
                userId
            );
            if (!isOwner) {
                throw new ForbiddenError("You do not have access to this booking");
            }
        }

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
     * Confirm a pending booking (provider action)
     */
    async confirmBooking(bookingId: string, providerUserId: string, data: ConfirmBookingData) {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found", "BOOKING_NOT_FOUND");
        }

        // Verify provider ownership
        const isOwner = await this.verifyEntityOwnership(
            booking.entityType,
            booking.entityId,
            providerUserId
        );

        if (!isOwner) {
            throw new ForbiddenError("You do not own this booking's entity");
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestError(
                `Cannot confirm a booking with status "${booking.status}"`,
                "INVALID_BOOKING_STATUS"
            );
        }

        const updated = await bookingRepo.confirmBooking(bookingId, data.providerNotes);

        // Notify customer
        const providerName = booking.providerName ?? "The provider";

        notificationService.notifyBookingConfirmed(
            booking.userId,
            booking.id,
            providerName,
            booking.entityName ?? booking.entityType
        ).catch((err) => {
            logger.error({ err, bookingId }, "Failed to send booking confirmed notification");
        });

        // Send email to customer
        const customer = await prisma.user.findUnique({
            where: { id: booking.userId },
            select: { email: true, firstName: true, emailNotifications: true },
        });

        if (customer && customer.emailNotifications !== false) {
            sendBookingConfirmedNotificationEmail(
                customer.email,
                customer.firstName,
                providerName,
                booking.entityName ?? booking.entityType,
                booking.id,
                booking.referenceNumber,
                booking.date ? booking.date.toISOString() : null,
                booking.guests,
                data.providerNotes ?? null
            ).catch((err) => {
                logger.error({ err, bookingId }, "Failed to send booking confirmed email");
            });
        }

        logger.info({ bookingId, providerUserId }, "Booking confirmed");
        return updated;
    }

    /**
     * Decline a pending booking (provider action)
     */
    async declineBooking(bookingId: string, providerUserId: string, data: DeclineBookingData) {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            throw new NotFoundError("Booking not found", "BOOKING_NOT_FOUND");
        }

        // Verify provider ownership
        const isOwner = await this.verifyEntityOwnership(
            booking.entityType,
            booking.entityId,
            providerUserId
        );

        if (!isOwner) {
            throw new ForbiddenError("You do not own this booking's entity");
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestError(
                `Cannot decline a booking with status "${booking.status}"`,
                "INVALID_BOOKING_STATUS"
            );
        }

        const updated = await bookingRepo.declineBooking(bookingId, data.declinedReason);

        // Notify customer
        const providerName = booking.providerName ?? "The provider";

        notificationService.notifyBookingDeclined(
            booking.userId,
            booking.id,
            providerName,
            booking.entityName ?? booking.entityType
        ).catch((err) => {
            logger.error({ err, bookingId }, "Failed to send booking declined notification");
        });

        // Send email to customer
        const customer = await prisma.user.findUnique({
            where: { id: booking.userId },
            select: { email: true, firstName: true, emailNotifications: true },
        });

        if (customer && customer.emailNotifications !== false) {
            sendBookingDeclinedEmail(
                customer.email,
                customer.firstName,
                providerName,
                booking.entityName ?? booking.entityType,
                data.declinedReason
            ).catch((err) => {
                logger.error({ err, bookingId }, "Failed to send booking declined email");
            });
        }

        logger.info({ bookingId, providerUserId, reason: data.declinedReason }, "Booking declined");
        return updated;
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

        if (booking.status === BookingStatus.DECLINED) {
            throw new BadRequestError("Cannot cancel a declined booking", "BOOKING_DECLINED");
        }

        const updated = await bookingRepo.updateStatus(
            bookingId,
            BookingStatus.CANCELLED,
            new Date()
        );

        // Notify provider
        const customerName = `${booking.user.firstName} ${booking.user.lastName}`;
        const providerUserId = booking.providerUserId;

        if (providerUserId) {
            notificationService.notifyBookingCancelled(
                providerUserId,
                booking.id,
                customerName,
                booking.entityName ?? booking.entityType
            ).catch((err) => {
                logger.error({ err, bookingId }, "Failed to send booking cancelled notification");
            });

            // Send email to provider
            const provider = await prisma.user.findUnique({
                where: { id: providerUserId },
                select: { email: true, firstName: true, emailNotifications: true },
            });

            if (provider && provider.emailNotifications !== false) {
                sendBookingCancelledEmail(
                    provider.email,
                    provider.firstName,
                    customerName,
                    booking.entityName ?? booking.entityType,
                    booking.referenceNumber,
                    booking.date ? booking.date.toISOString() : null
                ).catch((err) => {
                    logger.error({ err, bookingId }, "Failed to send booking cancelled email");
                });
            }
        }

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

        const updated = await bookingRepo.completeBooking(bookingId);

        // Notify customer
        notificationService.notifyBookingCompleted(
            booking.userId,
            booking.id,
            booking.entityName ?? booking.entityType
        ).catch((err) => {
            logger.error({ err, bookingId }, "Failed to send booking completed notification");
        });

        // Send email to customer
        const customer = await prisma.user.findUnique({
            where: { id: booking.userId },
            select: { email: true, firstName: true, emailNotifications: true },
        });

        if (customer && customer.emailNotifications !== false) {
            sendBookingCompletedEmail(
                customer.email,
                customer.firstName,
                booking.entityName ?? booking.entityType,
                booking.referenceNumber,
                booking.entityType,
                booking.entityId
            ).catch((err) => {
                logger.error({ err, bookingId }, "Failed to send booking completed email");
            });
        }

        logger.info({ bookingId, providerUserId }, "Booking completed");
        return updated;
    }

    /**
     * Check tour availability for a given date and guest count
     */
    async checkTourAvailability(
        tourId: string,
        date: Date,
        guests: number
    ): Promise<AvailabilityResult> {
        const tour = await prisma.tour.findUnique({
            where: { id: tourId },
            select: {
                id: true,
                isActive: true,
                availabilityType: true,
                availableDates: true,
                maxPeople: true,
            },
        });

        if (!tour) {
            throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
        }

        if (!tour.isActive) {
            return { available: false, remainingSpots: 0, reason: "Tour is no longer available" };
        }

        // Check date against availability rules
        const dateValid = this.isDateAvailable(tour.availabilityType, tour.availableDates, date);
        if (!dateValid) {
            return {
                available: false,
                remainingSpots: 0,
                reason: this.getAvailabilityReasonMessage(tour.availabilityType),
            };
        }

        // If no maxPeople set, treat as unlimited
        if (!tour.maxPeople) {
            return { available: true, remainingSpots: 999 };
        }

        // Count existing booked guests for this date
        const bookedGuests = await bookingRepo.countBookedGuests(tourId, date);
        const remainingSpots = tour.maxPeople - bookedGuests;

        if (guests > remainingSpots) {
            return {
                available: false,
                remainingSpots,
                reason: remainingSpots === 0
                    ? "No spots available for this date"
                    : `Only ${remainingSpots} spot${remainingSpots !== 1 ? "s" : ""} remaining for this date`,
            };
        }

        return { available: true, remainingSpots };
    }

    /**
     * Check if a date matches the tour's availability rules
     */
    private isDateAvailable(
        availabilityType: string,
        availableDates: string | null,
        date: Date
    ): boolean {
        const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

        switch (availabilityType) {
            case "DAILY":
                return true;

            case "WEEKDAYS":
                return dayOfWeek >= 1 && dayOfWeek <= 5;

            case "WEEKENDS":
                return dayOfWeek === 0 || dayOfWeek === 6;

            case "SPECIFIC_DATES": {
                if (!availableDates) return false;
                try {
                    const dates = JSON.parse(availableDates) as string[];
                    const dateStr = date.toISOString().split("T")[0];
                    return dates.includes(dateStr);
                } catch {
                    return false;
                }
            }

            case "BY_REQUEST":
                // Always valid — provider will manually confirm
                return true;

            default:
                return true;
        }
    }

    /**
     * Get a human-readable reason for why a date is unavailable
     */
    private getAvailabilityReasonMessage(availabilityType: string): string {
        switch (availabilityType) {
            case "WEEKDAYS":
                return "This tour is only available on weekdays (Monday–Friday)";
            case "WEEKENDS":
                return "This tour is only available on weekends (Saturday–Sunday)";
            case "SPECIFIC_DATES":
                return "This date is not in the tour's available dates";
            default:
                return "This date is not available";
        }
    }

    /**
     * Get entity details for validation
     */
    private async getEntityDetails(
        entityType: string,
        entityId: string
    ): Promise<{ ownerId: string; isActive: boolean; price: number; currency: string | null } | null> {
        switch (entityType) {
            case "TOUR": {
                const tour = await prisma.tour.findUnique({
                    where: { id: entityId },
                    select: { ownerId: true, isActive: true, price: true, currency: true },
                });
                if (!tour) return null;
                return { ownerId: tour.ownerId, isActive: tour.isActive, price: Number(tour.price), currency: tour.currency };
            }
            case "GUIDE": {
                const guide = await prisma.guide.findUnique({
                    where: { id: entityId },
                    select: { userId: true, isAvailable: true, pricePerDay: true, currency: true },
                });
                if (!guide) return null;
                return { ownerId: guide.userId, isActive: guide.isAvailable, price: Number(guide.pricePerDay ?? 0), currency: guide.currency };
            }
            case "DRIVER": {
                const driver = await prisma.driver.findUnique({
                    where: { id: entityId },
                    select: { userId: true, isAvailable: true },
                });
                if (!driver) return null;
                return { ownerId: driver.userId, isActive: driver.isAvailable, price: 0, currency: "GEL" };
            }
            default:
                return null;
        }
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
