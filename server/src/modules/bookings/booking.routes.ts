import type { FastifyInstance } from "fastify";
import { bookingController } from "./booking.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function bookingRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    // Create a direct booking
    app.post(
        "/bookings",
        {
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.createBooking.bind(bookingController)
    );

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

    // Get a single booking by ID
    app.get(
        "/bookings/:id",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.getBooking.bind(bookingController)
    );

    // Confirm a pending booking (provider)
    app.patch(
        "/bookings/:id/confirm",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.confirmBooking.bind(bookingController)
    );

    // Decline a pending booking (provider)
    app.patch(
        "/bookings/:id/decline",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        bookingController.declineBooking.bind(bookingController)
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
