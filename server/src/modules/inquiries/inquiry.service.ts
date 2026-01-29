import { inquiryRepo } from "./inquiry.repo.js";
import { InquiryStatus, InquiryTargetType, NotificationType } from "@prisma/client";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { prisma } from "../../libs/prisma.js";
import { notificationService } from "../notifications/notification.service.js";
import { logger } from "../../libs/logger.js";
import { CreateInquiryData, InquiryFilters, InquiryWithResponses } from "./inquiry.types.js";

export class InquiryService {
    /**
     * Create a new inquiry
     */
    async createInquiry(data: CreateInquiryData) {
        // Validate target IDs exist and resolve to Profile IDs + User IDs
        const resolvedTargets = await this.resolveTargets(
            data.targetType,
            data.targetIds
        );

        if (resolvedTargets.length === 0) {
            throw new BadRequestError("No valid targets found");
        }

        // Use the resolved Profile IDs for the inquiry record (Data Normalization)
        // This ensures that even if User ID was passed, we store the correct Profile ID
        const cleanTargetIds = resolvedTargets.map(t => t.targetId);
        const recipientUserIds = resolvedTargets.map(t => t.userId);

        // Create inquiry with clean IDs
        const inquiry = await inquiryRepo.createInquiry({
            ...data,
            targetIds: cleanTargetIds
        });

        // Create inquiry response records for each recipient
        await Promise.all(
            recipientUserIds.map((recipientId) =>
                inquiryRepo.createInquiryResponse(inquiry.id, recipientId)
            )
        );

        // Send notifications to all recipients
        const senderName = `${inquiry.user.firstName} ${inquiry.user.lastName}`;

        await Promise.all(
            recipientUserIds.map((recipientId) =>
                notificationService.notifyInquiryReceived(
                    recipientId,
                    inquiry.id,
                    senderName
                )
            )
        );

        // Fetch complete inquiry with responses
        const completeInquiry = await inquiryRepo.findById(inquiry.id);

        logger.info(
            { inquiryId: inquiry.id, recipientCount: recipientUserIds.length },
            "Inquiry created"
        );

        return this.formatInquiry(completeInquiry!);
    }

    /**
     * Resolve target IDs to valid Profile IDs and User IDs
     * Accepts either Profile ID or User ID for the target
     */
    private async resolveTargets(
        targetType: InquiryTargetType,
        targetIds: string[]
    ): Promise<{ targetId: string; userId: string }[]> {
        switch (targetType) {
            case InquiryTargetType.TOUR: {
                // For tours, we can only look up by Tour ID
                const tours = await prisma.tour.findMany({
                    where: { id: { in: targetIds } },
                    select: { id: true, ownerId: true },
                });
                return tours.map((t) => ({ targetId: t.id, userId: t.ownerId }));
            }

            case InquiryTargetType.GUIDE: {
                // Look up by Guide ID OR User ID
                const guides = await prisma.guide.findMany({
                    where: {
                        OR: [
                            { id: { in: targetIds } },
                            { userId: { in: targetIds } }
                        ]
                    },
                    select: { id: true, userId: true },
                });
                return guides.map((g) => ({ targetId: g.id, userId: g.userId }));
            }

            case InquiryTargetType.DRIVER: {
                // Look up by Driver ID OR User ID
                const drivers = await prisma.driver.findMany({
                    where: {
                        OR: [
                            { id: { in: targetIds } },
                            { userId: { in: targetIds } }
                        ]
                    },
                    select: { id: true, userId: true },
                });
                return drivers.map((d) => ({ targetId: d.id, userId: d.userId }));
            }

            case InquiryTargetType.COMPANY: {
                // Look up by Company ID OR User ID
                const companies = await prisma.company.findMany({
                    where: {
                        OR: [
                            { id: { in: targetIds } },
                            { userId: { in: targetIds } }
                        ]
                    },
                    select: { id: true, userId: true },
                });
                return companies.map((c) => ({ targetId: c.id, userId: c.userId }));
            }

            default:
                return [];
        }
    }

    /**
     * Get user's sent inquiries
     */
    async getUserInquiries(
        userId: string,
        page: number,
        limit: number,
        filters: InquiryFilters
    ) {
        const { inquiries, total } = await inquiryRepo.findUserInquiries(
            userId,
            page,
            limit,
            filters
        );

        const formattedInquiries = inquiries.map((i) => this.formatInquiry(i));

        return { inquiries: formattedInquiries, total };
    }

    /**
     * Get received inquiries (as guide/driver/company)
     */
    async getReceivedInquiries(
        userId: string,
        page: number,
        limit: number,
        filters: InquiryFilters
    ) {
        const { responses, total } = await inquiryRepo.findReceivedInquiries(
            userId,
            page,
            limit,
            filters
        );

        // Transform responses to include inquiry data
        const formattedResponses = responses.map((r) => ({
            id: r.id,
            inquiryId: r.inquiryId,
            inquiry: this.formatInquiry(r.inquiry),
            status: r.status,
            message: r.message,
            respondedAt: r.respondedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));

        return { inquiries: formattedResponses, total };
    }

    /**
     * Get inquiry by ID
     */
    async getInquiryById(inquiryId: string, userId: string) {
        const inquiry = await inquiryRepo.findById(inquiryId);

        if (!inquiry) {
            throw new NotFoundError("Inquiry not found");
        }

        // Authorization: Must be sender or recipient
        const isAuthorized =
            inquiry.userId === userId ||
            inquiry.responses.some((r) => r.recipientId === userId);

        if (!isAuthorized) {
            throw new ForbiddenError("You do not have access to this inquiry");
        }

        return this.formatInquiry(inquiry);
    }

    /**
     * Respond to inquiry
     */
    async respondToInquiry(
        inquiryId: string,
        recipientId: string,
        status: InquiryStatus,
        message?: string
    ) {
        // Check if inquiry exists
        const inquiry = await inquiryRepo.findById(inquiryId);

        if (!inquiry) {
            throw new NotFoundError("Inquiry not found");
        }

        // Check if user is a recipient
        const inquiryResponse = await inquiryRepo.findInquiryResponse(
            inquiryId,
            recipientId
        );

        if (!inquiryResponse) {
            throw new ForbiddenError("You are not a recipient of this inquiry");
        }

        // Cannot respond if already responded with accept/decline
        if (
            inquiryResponse.status === InquiryStatus.ACCEPTED ||
            inquiryResponse.status === InquiryStatus.DECLINED
        ) {
            throw new BadRequestError(
                `You have already ${inquiryResponse.status.toLowerCase()} this inquiry`
            );
        }

        // Update response
        const updatedResponse = await inquiryRepo.updateInquiryResponse(
            inquiryId,
            recipientId,
            status,
            message
        );

        // Notify inquiry creator
        const recipientName = `${updatedResponse.recipient.firstName} ${updatedResponse.recipient.lastName}`;
        let notificationMessage = "";

        switch (status) {
            case InquiryStatus.RESPONDED:
                notificationMessage = `${recipientName} responded to your inquiry`;
                break;
            case InquiryStatus.ACCEPTED:
                notificationMessage = `${recipientName} accepted your inquiry`;
                break;
            case InquiryStatus.DECLINED:
                notificationMessage = `${recipientName} declined your inquiry`;
                break;
        }

        await notificationService.createNotification({
            userId: inquiry.userId,
            type: NotificationType.INQUIRY_RESPONSE,
            title: "Inquiry Response",
            message: notificationMessage,
            data: {
                inquiryId,
                recipientId,
                status,
            },
        });

        logger.info(
            { inquiryId, recipientId, status },
            "Inquiry response updated"
        );

        return updatedResponse;
    }

    /**
     * Format inquiry for response (parse JSON targetIds)
     */
    private formatInquiry(inquiry: {
        id: string;
        userId: string;
        targetType: InquiryTargetType;
        targetIds: string;
        subject: string;
        message: string;
        requiresPayment: boolean;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        responses: Array<{
            id: string;
            recipientId: string;
            status: InquiryStatus;
            message: string | null;
            respondedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            recipient: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
        }>;
    }): InquiryWithResponses {
        let parsedTargetIds: string[];
        try {
            parsedTargetIds = JSON.parse(inquiry.targetIds) as string[];
        } catch {
            // Fallback to empty array if JSON is malformed
            logger.warn({ inquiryId: inquiry.id, targetIds: inquiry.targetIds }, "Failed to parse inquiry targetIds");
            parsedTargetIds = [];
        }

        return {
            ...inquiry,
            targetIds: parsedTargetIds,
        };
    }
}

export const inquiryService = new InquiryService();
