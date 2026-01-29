import { FastifyInstance } from "fastify";
import { inquiryController } from "./inquiry.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";

export async function inquiryRoutes(app: FastifyInstance) {
    // All routes require authentication
    app.addHook("preHandler", authGuard);

    // Create inquiry
    app.post(
        "/inquiries",
        {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: "1 minute",
                },
            },
        },
        inquiryController.createInquiry.bind(inquiryController)
    );

    // Get user's sent inquiries
    app.get(
        "/inquiries",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        inquiryController.getInquiries.bind(inquiryController)
    );

    // Get received inquiries (as guide/driver/company)
    app.get(
        "/inquiries/received",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        inquiryController.getReceivedInquiries.bind(inquiryController)
    );

    // Get inquiry by ID
    app.get(
        "/inquiries/:id",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        inquiryController.getInquiryById.bind(inquiryController)
    );

    // Respond to inquiry
    app.post(
        "/inquiries/:id/respond",
        {
            config: {
                rateLimit: {
                    max: 30,
                    timeWindow: "1 minute",
                },
            },
        },
        inquiryController.respondToInquiry.bind(inquiryController)
    );
}
