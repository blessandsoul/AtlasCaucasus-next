import { inquiryRepo } from "./inquiry.repo.js";
import { InquiryStatus, InquiryTargetType, NotificationType } from "@prisma/client";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { prisma } from "../../libs/prisma.js";
import { notificationService } from "../notifications/notification.service.js";
import { logger } from "../../libs/logger.js";
import { sendInquiryReceivedEmail, sendInquiryResponseEmail, sendBookingConfirmedEmail } from "../../libs/email.js";
import { CreateInquiryData, InquiryFilters, InquiryWithResponses } from "./inquiry.types.js";
import { bookingService } from "../bookings/booking.service.js";
import { bookingRepo, lookupEntityInfo } from "../bookings/booking.repo.js";

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

        // Send email notifications to all recipients (fire-and-forget)
        const recipientUsers = await prisma.user.findMany({
            where: { id: { in: recipientUserIds } },
            select: { id: true, email: true, firstName: true, emailNotifications: true },
        });

        const messagePreview = data.message.substring(0, 200);

        Promise.allSettled(
            recipientUsers
                .filter((u) => u.emailNotifications !== false)
                .map((recipient) =>
                    sendInquiryReceivedEmail(
                        recipient.email,
                        recipient.firstName,
                        senderName,
                        data.subject,
                        messagePreview,
                        inquiry.id
                    )
                )
        ).then((results) => {
            const failed = results.filter((r) => r.status === "rejected");
            if (failed.length > 0) {
                logger.error(
                    { inquiryId: inquiry.id, failedCount: failed.length },
                    "Some inquiry notification emails failed to send"
                );
            }
        });

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

        // Send email notification to inquiry creator (fire-and-forget)
        const inquiryCreator = await prisma.user.findUnique({
            where: { id: inquiry.userId },
            select: { email: true, firstName: true, emailNotifications: true },
        });

        if (inquiryCreator && inquiryCreator.emailNotifications !== false) {
            sendInquiryResponseEmail(
                inquiryCreator.email,
                inquiryCreator.firstName,
                recipientName,
                status as "ACCEPTED" | "DECLINED" | "RESPONDED",
                message || null,
                inquiryId
            ).catch((err) => {
                logger.error(
                    { err, inquiryId, recipientId },
                    "Failed to send inquiry response email"
                );
            });
        }

        // Calculate and update provider's average response time (fire-and-forget)
        this.updateProviderResponseTime(inquiry, recipientId).catch((err) => {
            logger.error(
                { err, inquiryId, recipientId },
                "Failed to update provider response time"
            );
        });

        // Auto-create booking when inquiry is accepted
        if (status === InquiryStatus.ACCEPTED) {
            this.createBookingFromInquiry(inquiry, recipientId, recipientName).catch((err) => {
                logger.error(
                    { err, inquiryId, recipientId },
                    "Failed to auto-create booking from accepted inquiry"
                );
            });
        }

        logger.info(
            { inquiryId, recipientId, status },
            "Inquiry response updated"
        );

        return updatedResponse;
    }

    /**
     * Calculate response time and update the provider's rolling average
     */
    private async updateProviderResponseTime(
        inquiry: { createdAt: Date; targetType: InquiryTargetType },
        recipientId: string
    ): Promise<void> {
        const responseTimeMinutes = Math.round(
            (Date.now() - inquiry.createdAt.getTime()) / (1000 * 60)
        );

        // Find which profile type this recipient has and update accordingly
        const [guide, driver, company] = await Promise.all([
            prisma.guide.findUnique({ where: { userId: recipientId }, select: { id: true, avgResponseTimeMinutes: true, responseCount: true } }),
            prisma.driver.findUnique({ where: { userId: recipientId }, select: { id: true, avgResponseTimeMinutes: true, responseCount: true } }),
            prisma.company.findUnique({ where: { userId: recipientId }, select: { id: true, avgResponseTimeMinutes: true, responseCount: true } }),
        ]);

        const updateAvg = (oldAvg: number | null, count: number, newTime: number): number => {
            if (oldAvg === null || count === 0) return newTime;
            return Math.round(((oldAvg * count) + newTime) / (count + 1));
        };

        if (guide) {
            const newAvg = updateAvg(guide.avgResponseTimeMinutes, guide.responseCount, responseTimeMinutes);
            await prisma.guide.update({
                where: { id: guide.id },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
        }

        if (driver) {
            const newAvg = updateAvg(driver.avgResponseTimeMinutes, driver.responseCount, responseTimeMinutes);
            await prisma.driver.update({
                where: { id: driver.id },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
        }

        if (company) {
            const newAvg = updateAvg(company.avgResponseTimeMinutes, company.responseCount, responseTimeMinutes);
            await prisma.company.update({
                where: { id: company.id },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
        }
    }

    /**
     * Auto-create a booking when an inquiry is accepted
     * Now populates entityName, entityImage, providerUserId, providerName, and referenceNumber
     */
    private async createBookingFromInquiry(
        inquiry: { id: string; userId: string; targetType: InquiryTargetType; targetIds: string },
        recipientId: string,
        recipientName: string
    ): Promise<void> {
        let parsedTargetIds: string[];
        try {
            parsedTargetIds = JSON.parse(inquiry.targetIds) as string[];
        } catch {
            logger.warn({ inquiryId: inquiry.id }, "Failed to parse targetIds for booking creation");
            return;
        }

        // Map InquiryTargetType to BookingEntityType (skip COMPANY — not bookable)
        const entityTypeMap: Record<string, string> = {
            TOUR: "TOUR",
            GUIDE: "GUIDE",
            DRIVER: "DRIVER",
        };

        const bookingEntityType = entityTypeMap[inquiry.targetType];
        if (!bookingEntityType) {
            return; // COMPANY inquiries don't auto-create bookings
        }

        // Create a booking for each target entity with full entity info
        for (const entityId of parsedTargetIds) {
            const entityInfo = await lookupEntityInfo(bookingEntityType, entityId);

            await bookingRepo.createFromInquiry({
                userId: inquiry.userId,
                entityType: bookingEntityType as "TOUR" | "GUIDE" | "DRIVER",
                entityId,
                inquiryId: inquiry.id,
                entityName: entityInfo.entityName,
                entityImage: entityInfo.entityImage,
                providerUserId: entityInfo.providerUserId,
                providerName: entityInfo.providerName,
            });
        }

        // Send booking confirmation email to the user (fire-and-forget)
        const inquiryCreator = await prisma.user.findUnique({
            where: { id: inquiry.userId },
            select: { email: true, firstName: true, emailNotifications: true },
        });

        if (inquiryCreator && inquiryCreator.emailNotifications !== false) {
            sendBookingConfirmedEmail(
                inquiryCreator.email,
                inquiryCreator.firstName,
                recipientName,
                bookingEntityType,
                inquiry.id
            ).catch((err) => {
                logger.error(
                    { err, inquiryId: inquiry.id },
                    "Failed to send booking confirmation email"
                );
            });
        }

        // Send notification
        await notificationService.createNotification({
            userId: inquiry.userId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: "Booking Confirmed",
            message: `Your booking with ${recipientName} has been confirmed!`,
            data: { inquiryId: inquiry.id, entityType: bookingEntityType },
        });
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
