import { FastifyInstance } from "fastify";
import { bookingController } from "./booking.controller.js";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";

export async function bookingRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    // Get user's bookings (as customer)
    app.get(
        "/bookings",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.getUserBookings.bind(bookingController)
    );

    // Get provider's received bookings
    app.get(
        "/bookings/received",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.getReceivedBookings.bind(bookingController)
    );

    // Cancel a booking
    app.patch(
        "/bookings/:id/cancel",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.cancelBooking.bind(bookingController)
    );

    // Mark booking as completed (provider only)
    app.patch(
        "/bookings/:id/complete",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.completeBooking.bind(bookingController)
    );
}
