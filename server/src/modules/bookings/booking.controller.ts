import type { FastifyRequest, FastifyReply } from "fastify";
import { bookingService } from "./booking.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import {
    BookingQuerySchema,
    BookingIdParamSchema,
    CreateDirectBookingSchema,
    ConfirmBookingSchema,
    DeclineBookingSchema,
    AvailabilityQuerySchema,
    TourIdParamSchema,
} from "./booking.schemas.js";

export class BookingController {
    /**
     * POST /api/v1/bookings
     * Create a direct booking
     */
    async createBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = CreateDirectBookingSchema.parse(request.body);

        const booking = await bookingService.createDirectBooking({
            ...body,
            userId,
        });

        return reply.status(201).send(successResponse("Booking created successfully", booking));
    }

    /**
     * GET /api/v1/bookings/:id
     * Get booking detail
     */
    async getBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const { id } = BookingIdParamSchema.parse(request.params);

        const booking = await bookingService.getBookingById(id, userId);

        return reply.send(successResponse("Booking retrieved successfully", booking));
    }

    /**
     * GET /api/v1/bookings
     * Get user's bookings (as customer)
     */
    async getUserBookings(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = BookingQuerySchema.parse(request.query);

        const { items, totalItems } = await bookingService.getUserBookings(
            userId,
            query.page,
            query.limit,
            { status: query.status, entityType: query.entityType }
        );

        return reply.send(
            paginatedResponse("Bookings retrieved successfully", items, query.page, query.limit, totalItems)
        );
    }

    /**
     * GET /api/v1/bookings/received
     * Get provider's received bookings
     */
    async getReceivedBookings(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = BookingQuerySchema.parse(request.query);

        const { items, totalItems } = await bookingService.getReceivedBookings(
            userId,
            query.page,
            query.limit,
            { status: query.status, entityType: query.entityType }
        );

        return reply.send(
            paginatedResponse("Received bookings retrieved successfully", items, query.page, query.limit, totalItems)
        );
    }

    /**
     * PATCH /api/v1/bookings/:id/confirm
     * Confirm a pending booking (provider)
     */
    async confirmBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const { id } = BookingIdParamSchema.parse(request.params);
        const body = ConfirmBookingSchema.parse(request.body ?? {});

        const booking = await bookingService.confirmBooking(id, userId, body);

        return reply.send(successResponse("Booking confirmed successfully", booking));
    }

    /**
     * PATCH /api/v1/bookings/:id/decline
     * Decline a pending booking (provider)
     */
    async declineBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const { id } = BookingIdParamSchema.parse(request.params);
        const body = DeclineBookingSchema.parse(request.body);

        const booking = await bookingService.declineBooking(id, userId, body);

        return reply.send(successResponse("Booking declined", booking));
    }

    /**
     * PATCH /api/v1/bookings/:id/cancel
     * Cancel a booking
     */
    async cancelBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const { id } = BookingIdParamSchema.parse(request.params);

        const booking = await bookingService.cancelBooking(id, userId);

        return reply.send(successResponse("Booking cancelled successfully", booking));
    }

    /**
     * PATCH /api/v1/bookings/:id/complete
     * Mark booking as completed (provider only)
     */
    async completeBooking(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const { id } = BookingIdParamSchema.parse(request.params);

        const booking = await bookingService.completeBooking(id, userId);

        return reply.send(successResponse("Booking marked as completed", booking));
    }

    /**
     * GET /api/v1/tours/:id/availability
     * Check tour availability for a date and guest count
     */
    async checkAvailability(request: FastifyRequest, reply: FastifyReply) {
        const { id } = TourIdParamSchema.parse(request.params);
        const query = AvailabilityQuerySchema.parse(request.query);

        const result = await bookingService.checkTourAvailability(
            id,
            new Date(query.date),
            query.guests
        );

        return reply.send(successResponse("Availability checked", result));
    }
}

export const bookingController = new BookingController();
