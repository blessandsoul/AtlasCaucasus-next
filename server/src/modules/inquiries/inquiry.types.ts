import { InquiryStatus, InquiryTargetType } from "@prisma/client";

/**
 * User info included in inquiry responses
 */
export interface InquiryUserInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

/**
 * Response detail for an individual recipient
 */
export interface InquiryResponseDetail {
    id: string;
    recipientId: string;
    recipient: InquiryUserInfo;
    status: InquiryStatus;
    message: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Full inquiry response with all details
 */
export interface InquiryWithResponses {
    id: string;
    userId: string;
    user: InquiryUserInfo;
    targetType: InquiryTargetType;
    targetIds: string[];
    subject: string;
    message: string;
    requiresPayment: boolean;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    responses: InquiryResponseDetail[];
}

/**
 * Data required to create an inquiry
 */
export interface CreateInquiryData {
    userId: string;
    targetType: InquiryTargetType;
    targetIds: string[];
    subject: string;
    message: string;
}

/**
 * Data for responding to an inquiry
 */
export interface RespondToInquiryData {
    inquiryId: string;
    recipientId: string;
    status: InquiryStatus;
    message?: string;
}

/**
 * Filters for querying inquiries
 */
export interface InquiryFilters {
    status?: InquiryStatus;
    targetType?: InquiryTargetType;
}

/**
 * Received inquiry as seen by recipient
 */
export interface ReceivedInquiry {
    id: string;
    inquiryId: string;
    inquiry: InquiryWithResponses;
    status: InquiryStatus;
    message: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
