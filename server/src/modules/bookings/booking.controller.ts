import { FastifyRequest, FastifyReply } from "fastify";
import { bookingService } from "./booking.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { BookingQuerySchema, BookingIdParamSchema } from "./booking.schemas.js";

export class BookingController {
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
}

export const bookingController = new BookingController();
