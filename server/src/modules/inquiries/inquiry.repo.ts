import { prisma } from "../../libs/prisma.js";
import { InquiryStatus, InquiryTargetType } from "@prisma/client";
import { CreateInquiryData, InquiryFilters } from "./inquiry.types.js";

/**
 * User select for inclusion in inquiry responses
 */
const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
};

export class InquiryRepository {
    /**
     * Create a new inquiry
     */
    async createInquiry(data: CreateInquiryData) {
        // Calculate expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        return prisma.inquiry.create({
            data: {
                userId: data.userId,
                targetType: data.targetType,
                targetIds: JSON.stringify(data.targetIds),
                subject: data.subject,
                message: data.message,
                requiresPayment: data.targetIds.length > 2,
                expiresAt,
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Create inquiry response record for each recipient
     */
    async createInquiryResponse(inquiryId: string, recipientId: string) {
        return prisma.inquiryResponse.create({
            data: {
                inquiryId,
                recipientId,
                status: InquiryStatus.PENDING,
            },
        });
    }

    /**
     * Get inquiry by ID with all responses
     */
    async findById(inquiryId: string) {
        return prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: {
                user: {
                    select: userSelect,
                },
                responses: {
                    include: {
                        recipient: {
                            select: userSelect,
                        },
                    },
                },
            },
        });
    }

    /**
     * Get user's sent inquiries with pagination
     */
    async findUserInquiries(
        userId: string,
        page: number,
        limit: number,
        filters: InquiryFilters
    ) {
        const skip = (page - 1) * limit;
        const whereClause: {
            userId: string;
            targetType?: InquiryTargetType;
        } = { userId };

        if (filters.targetType) {
            whereClause.targetType = filters.targetType;
        }

        const [inquiries, total] = await Promise.all([
            prisma.inquiry.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: userSelect,
                    },
                    responses: {
                        include: {
                            recipient: {
                                select: userSelect,
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.inquiry.count({ where: whereClause }),
        ]);

        return { inquiries, total };
    }

    /**
     * Get received inquiries for a user (as guide/driver/company)
     */
    async findReceivedInquiries(
        recipientId: string,
        page: number,
        limit: number,
        filters: InquiryFilters
    ) {
        const skip = (page - 1) * limit;
        const whereClause: {
            recipientId: string;
            status?: InquiryStatus;
        } = { recipientId };

        if (filters.status) {
            whereClause.status = filters.status;
        }

        const [responses, total] = await Promise.all([
            prisma.inquiryResponse.findMany({
                where: whereClause,
                include: {
                    inquiry: {
                        include: {
                            user: {
                                select: userSelect,
                            },
                            responses: {
                                include: {
                                    recipient: {
                                        select: userSelect,
                                    },
                                },
                            },
                        },
                    },
                    recipient: {
                        select: userSelect,
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.inquiryResponse.count({ where: whereClause }),
        ]);

        return { responses, total };
    }

    /**
     * Update inquiry response status and message
     */
    async updateInquiryResponse(
        inquiryId: string,
        recipientId: string,
        status: InquiryStatus,
        message?: string
    ) {
        return prisma.inquiryResponse.update({
            where: {
                inquiryId_recipientId: { inquiryId, recipientId },
            },
            data: {
                status,
                message,
                respondedAt: new Date(),
            },
            include: {
                recipient: {
                    select: userSelect,
                },
            },
        });
    }

    /**
     * Find inquiry response by inquiry and recipient
     */
    async findInquiryResponse(inquiryId: string, recipientId: string) {
        return prisma.inquiryResponse.findUnique({
            where: {
                inquiryId_recipientId: { inquiryId, recipientId },
            },
        });
    }

    /**
     * Mark expired inquiries (30 days old) as EXPIRED
     */
    async markExpiredInquiries() {
        const now = new Date();

        return prisma.inquiryResponse.updateMany({
            where: {
                status: InquiryStatus.PENDING,
                inquiry: {
                    expiresAt: { lt: now },
                },
            },
            data: {
                status: InquiryStatus.EXPIRED,
            },
        });
    }
}

export const inquiryRepo = new InquiryRepository();
