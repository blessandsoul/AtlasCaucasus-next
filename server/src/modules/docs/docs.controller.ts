import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse } from "../../libs/response.js";
import { env } from "../../config/env.js";

export class DocsController {
    /**
     * Get API information and documentation
     */
    async getApiInfo(_request: FastifyRequest, reply: FastifyReply) {
        const apiInfo = {
            name: "Tourism Server API",
            version: "1.0.0",
            description: "RESTful API for Georgian tourism platform with real-time capabilities",
            environment: env.NODE_ENV,
            baseUrl: `/api/v1`,
            documentation: {
                postman: "/postman_collection.json",
                openapi: "Coming soon",
            },
            features: [
                "Multi-role authentication (USER, COMPANY, GUIDE, DRIVER, ADMIN)",
                "JWT-based security with refresh tokens",
                "Real-time chat via WebSocket",
                "Push notifications",
                "Search & aggregation with Redis caching",
                "Reviews & ratings system",
                "Inquiry system for service requests",
                "Location-based services for Georgian tourism",
            ],
            modules: {
                auth: {
                    description: "Authentication & user management",
                    endpoints: [
                        "POST /auth/register - Register new user",
                        "POST /auth/login - Authenticate user",
                        "POST /auth/refresh - Refresh access token",
                        "POST /auth/logout - Logout user",
                        "GET /auth/me - Get current user",
                        "POST /auth/forgot-password - Request password reset",
                        "POST /auth/reset-password - Reset password",
                        "POST /auth/verify-email - Verify email address",
                    ],
                },
                users: {
                    description: "User profile management",
                    endpoints: [
                        "GET /users/me - Get profile",
                        "PATCH /users/me - Update profile",
                        "PATCH /users/me/password - Change password",
                        "POST /users/me/deactivate - Deactivate account",
                    ],
                },
                tours: {
                    description: "Tour listings management",
                    endpoints: [
                        "POST /tours - Create tour",
                        "GET /tours - List all tours",
                        "GET /tours/:id - Get tour details",
                        "PATCH /tours/:id - Update tour",
                        "DELETE /tours/:id - Delete tour",
                    ],
                },
                guides: {
                    description: "Tour guide profiles",
                    endpoints: [
                        "POST /guides - Create guide profile",
                        "GET /guides - List guides",
                        "GET /guides/:id - Get guide details",
                        "PATCH /guides/:id - Update guide",
                    ],
                },
                drivers: {
                    description: "Driver profiles",
                    endpoints: [
                        "POST /drivers - Create driver profile",
                        "GET /drivers - List drivers",
                        "GET /drivers/:id - Get driver details",
                        "PATCH /drivers/:id - Update driver",
                    ],
                },
                companies: {
                    description: "Tour company management",
                    endpoints: [
                        "POST /companies - Register company",
                        "GET /companies - List companies",
                        "GET /companies/:id - Get company details",
                        "PATCH /companies/:id - Update company",
                        "POST /companies/:id/agents - Create tour agent",
                    ],
                },
                chat: {
                    description: "Real-time messaging",
                    endpoints: [
                        "POST /chats/direct - Create direct chat",
                        "POST /chats/group - Create group chat",
                        "GET /chats - List user's chats",
                        "GET /chats/:id - Get chat details",
                        "POST /chats/:id/messages - Send message",
                        "GET /chats/:id/messages - Get messages",
                    ],
                },
                search: {
                    description: "Search & aggregation",
                    endpoints: [
                        "GET /search - Search tours/guides/drivers/companies",
                        "GET /search/locations - Location autocomplete",
                        "GET /search/locations/:id/stats - Location statistics",
                    ],
                },
                reviews: {
                    description: "Reviews & ratings",
                    endpoints: [
                        "POST /reviews - Create review",
                        "GET /reviews - Get reviews for target",
                        "GET /reviews/stats - Get review statistics",
                        "GET /reviews/my - Get user's reviews",
                        "PATCH /reviews/:id - Update review",
                        "DELETE /reviews/:id - Delete review",
                    ],
                },
                inquiries: {
                    description: "Service inquiry system",
                    endpoints: [
                        "POST /inquiries - Create inquiry",
                        "GET /inquiries/sent - Get sent inquiries",
                        "GET /inquiries/received - Get received inquiries",
                        "POST /inquiries/:id/respond - Respond to inquiry",
                    ],
                },
                notifications: {
                    description: "Push notifications",
                    endpoints: [
                        "GET /notifications - Get notifications",
                        "GET /notifications/unread/count - Get unread count",
                        "PATCH /notifications/:id/read - Mark as read",
                        "DELETE /notifications/:id - Delete notification",
                    ],
                },
                health: {
                    description: "System health monitoring",
                    endpoints: [
                        "GET /health - Basic health check",
                        "GET /health/detailed - Detailed health check",
                        "GET /health/metrics - Server metrics",
                        "GET /health/ready - Readiness probe",
                        "GET /health/live - Liveness probe",
                    ],
                },
            },
            websocket: {
                endpoint: "/ws",
                authentication: "JWT token as query parameter: /ws?token=<jwt>",
                events: {
                    incoming: [
                        "chat:send - Send chat message",
                        "chat:typing - Send typing indicator",
                        "chat:read - Mark messages as read",
                        "presence:heartbeat - Keep session alive",
                    ],
                    outgoing: [
                        "chat:message - New message received",
                        "chat:typing - User typing indicator",
                        "notification:new - New notification",
                        "presence:status - User online/offline status",
                    ],
                },
            },
            rateLimit: {
                default: "100 requests per minute",
                auth: "10 requests per 15 minutes",
                write: "30 requests per minute",
            },
            contact: {
                support: "support@tourismgeorgia.com",
            },
        };

        return reply.send(successResponse("Tourism Server API Documentation", apiInfo));
    }
}

export const docsController = new DocsController();
