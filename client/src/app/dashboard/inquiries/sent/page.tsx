'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSentInquiries } from '@/features/inquiries/hooks/useInquiries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import type { InquiryStatus, InquiryTargetType } from '@/features/inquiries/types/inquiry.types';

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

export default function SentInquiriesPage() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useSentInquiries({ page, limit: 10 });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">{t('inquiries.error.load', 'Failed to load inquiries')}</p>
            </div>
        );
    }

    const inquiries = data?.items || [];
    const pagination = data?.pagination;

    if (inquiries.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                        {t('inquiries.sent.empty', "You haven't sent any inquiries yet")}
                    </p>
                    <Link href={ROUTES.INQUIRIES.CREATE}>
                        <Button className="whitespace-normal h-auto text-center">{t('inquiries.sent.first_inquiry', 'Send Your First Inquiry')}</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {inquiries.map((inquiry) => (
                <Link key={inquiry.id} href={ROUTES.INQUIRIES.DETAILS(inquiry.id)}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
                                    <CardDescription>
                                        {getTargetTypeLabel(inquiry.targetType)} · {inquiry.targetIds.length} {t('inquiries.recipient', 'recipient')}(s)
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusBadgeVariant(inquiry.responses[0]?.status || 'PENDING')}>
                                    {inquiry.responses[0]?.status || 'PENDING'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {t('inquiries.sent_on', 'Sent')} {new Date(inquiry.createdAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            ))}

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {t('pagination.page', 'Page')} {pagination.page} {t('pagination.of', 'of')} {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!pagination.hasNextPage}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
