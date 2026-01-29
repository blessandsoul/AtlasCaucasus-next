import { FastifyRequest, FastifyReply } from "fastify";
import { inquiryService } from "./inquiry.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import {
    CreateInquirySchema,
    RespondToInquirySchema,
    InquiryQuerySchema,
} from "./inquiry.schemas.js";

export class InquiryController {
    /**
     * POST /api/v1/inquiries
     * Create new inquiry
     */
    async createInquiry(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = CreateInquirySchema.parse(request.body);

        const inquiry = await inquiryService.createInquiry({
            userId,
            ...body,
        });

        return reply.status(201).send(successResponse("Inquiry created successfully", inquiry));
    }

    /**
     * GET /api/v1/inquiries
     * Get user's sent inquiries
     */
    async getInquiries(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = InquiryQuerySchema.parse(request.query);

        const { inquiries, total } = await inquiryService.getUserInquiries(
            userId,
            query.page,
            query.limit,
            {
                status: query.status,
                targetType: query.targetType,
            }
        );

        return reply.send(
            paginatedResponse(
                "Inquiries retrieved successfully",
                inquiries,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * GET /api/v1/inquiries/received
     * Get received inquiries (as guide/driver/company)
     */
    async getReceivedInquiries(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = InquiryQuerySchema.parse(request.query);

        const { inquiries, total } = await inquiryService.getReceivedInquiries(
            userId,
            query.page,
            query.limit,
            {
                status: query.status,
                targetType: query.targetType,
            }
        );

        return reply.send(
            paginatedResponse(
                "Received inquiries retrieved successfully",
                inquiries,
                query.page,
                query.limit,
                total
            )
        );
    }

    /**
     * GET /api/v1/inquiries/:id
     * Get inquiry by ID
     */
    async getInquiryById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;

        const inquiry = await inquiryService.getInquiryById(id, userId);

        return reply.send(successResponse("Inquiry retrieved successfully", inquiry));
    }

    /**
     * POST /api/v1/inquiries/:id/respond
     * Respond to inquiry
     */
    async respondToInquiry(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const { id } = request.params;
        const body = RespondToInquirySchema.parse(request.body);

        const response = await inquiryService.respondToInquiry(
            id,
            userId,
            body.status,
            body.message
        );

        return reply.send(successResponse("Response sent successfully", response));
    }
}

export const inquiryController = new InquiryController();
