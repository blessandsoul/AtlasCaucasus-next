'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '@/features/inquiries/hooks/useInquiries';
import { useRespondToInquiry } from '@/features/inquiries/hooks/useRespondToInquiry';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Check, X, MessageSquare } from 'lucide-react';
import { isValidUuid } from '@/lib/utils/validation';
import type { InquiryStatus, InquiryTargetType, RespondToInquiryInput } from '@/features/inquiries/types/inquiry.types';

const getStatusBadgeVariant = (status: InquiryStatus) => {
    switch (status) {
        case 'PENDING':
            return 'secondary';
        case 'RESPONDED':
            return 'default';
        case 'ACCEPTED':
            return 'default';
        case 'DECLINED':
            return 'destructive';
        case 'EXPIRED':
            return 'outline';
        default:
            return 'secondary';
    }
};

const getTargetTypeLabel = (type: InquiryTargetType) => {
    switch (type) {
        case 'TOUR':
            return 'Tour';
        case 'GUIDE':
            return 'Guide';
        case 'DRIVER':
            return 'Driver';
        case 'COMPANY':
            return 'Company';
        default:
            return type;
    }
};

export default function InquiryDetailsPage() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params.id as string;

    // Validate UUID format before making API call
    const isValidId = isValidUuid(id);
    const { data: inquiry, isLoading, error } = useInquiry(isValidId ? id : '');
    const respondMutation = useRespondToInquiry();
    const [responseMessage, setResponseMessage] = useState('');
    const [showResponseForm, setShowResponseForm] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isValidId || error || !inquiry) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">{t('inquiries.error.load_single', 'Failed to load inquiry')}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    {t('common.go_back', 'Go Back')}
                </Button>
            </div>
        );
    }

    const isOwner = inquiry.userId === user?.id;
    const myResponse = inquiry.responses.find(r => r.recipientId === user?.id);
    const canRespond = myResponse && myResponse.status === 'PENDING';

    const handleRespond = (status: RespondToInquiryInput['status']) => {
        if (!id) return;
        respondMutation.mutate({
            id,
            data: {
                status,
                message: responseMessage || undefined,
            },
        });
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back', 'Back')}
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">{inquiry.subject}</CardTitle>
                            <CardDescription className="mt-1">
                                {isOwner ? t('inquiries.details.sent_to', 'Sent to') : t('inquiries.details.from', 'From')}{' '}
                                {isOwner
                                    ? `${inquiry.responses.length} ${t('inquiries.recipient', 'recipient')}(s)`
                                    : `${inquiry.user.firstName} ${inquiry.user.lastName}`}{' '}
                                · {getTargetTypeLabel(inquiry.targetType)}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground">{t('inquiries.details.message', 'Message')}</Label>
                        <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{t('inquiries.details.sent', 'Sent')}: {new Date(inquiry.createdAt).toLocaleString()}</span>
                        {inquiry.expiresAt && (
                            <span>{t('inquiries.details.expires', 'Expires')}: {new Date(inquiry.expiresAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Responses Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('inquiries.details.responses', 'Responses')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inquiry.responses.length === 0 ? (
                        <p className="text-muted-foreground">{t('inquiries.details.no_responses', 'No responses yet')}</p>
                    ) : (
                        inquiry.responses.map((response) => (
                            <div
                                key={response.id}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">
                                        {response.recipient.firstName} {response.recipient.lastName}
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(response.status)}>
                                        {response.status}
                                    </Badge>
                                </div>
                                {response.message && (
                                    <p className="text-sm text-muted-foreground">{response.message}</p>
                                )}
                                {response.respondedAt && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('inquiries.details.responded', 'Responded')}: {new Date(response.respondedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Response Form (for recipients) */}
            {canRespond && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t('inquiries.respond.title', 'Respond to Inquiry')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showResponseForm ? (
                            <>
                                <div>
                                    <Label htmlFor="message">{t('inquiries.respond.message_label', 'Your Response (Optional)')}</Label>
                                    <Textarea
                                        id="message"
                                        placeholder={t('inquiries.respond.message_placeholder', 'Add a message with your response...')}
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleRespond('ACCEPTED')}
                                        disabled={respondMutation.isPending}
                                        className="flex-1"
                                    >
                                        {respondMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Check className="h-4 w-4 mr-2" />
                                        )}
                                        {t('inquiries.respond.accept', 'Accept')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleRespond('DECLINED')}
                                        disabled={respondMutation.isPending}
                                        className="flex-1"
                                    >
                                        {respondMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <X className="h-4 w-4 mr-2" />
                                        )}
                                        {t('inquiries.respond.decline', 'Decline')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleRespond('RESPONDED')}
                                        disabled={respondMutation.isPending}
                                        className="flex-1"
                                    >
                                        {respondMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                        )}
                                        {t('inquiries.respond.reply_only', 'Reply Only')}
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowResponseForm(false)}
                                    className="w-full"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setShowResponseForm(true)} className="w-full">
                                {t('inquiries.respond.write', 'Write a Response')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
