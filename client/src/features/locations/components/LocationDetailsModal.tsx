'use client';

import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from '../hooks/useLocations';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatDate } from '@/lib/utils/format';
import { MapPin, Globe, Calendar, Activity } from 'lucide-react';

interface LocationDetailsModalProps {
    locationId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LocationDetailsModal = ({
    locationId,
    open,
    onOpenChange,
}: LocationDetailsModalProps) => {
    const { t } = useTranslation();
    const { data: location, isLoading, error } = useLocation(locationId || '');

    if (!locationId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('admin.locations.details.title', 'Location Details')}</DialogTitle>
                    <DialogDescription>
                        {t('admin.locations.details.description', 'Full information about the selected location.')}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <ErrorMessage error={error} />
                ) : location ? (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    {location.name}
                                </h3>
                                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                    <Globe className="h-4 w-4" />
                                    {[location.region, location.country].filter(Boolean).join(', ')}
                                </p>
                            </div>
                            <Badge
                                variant={location.isActive ? "outline" : "secondary"}
                                className={location.isActive
                                    ? "text-green-600 border-green-200 bg-green-50"
                                    : "text-muted-foreground bg-muted"
                                }
                            >
                                {location.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </Badge>
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                    {t('admin.locations.latitude', 'Latitude')}
                                </span>
                                <p className="font-mono text-sm mt-1">
                                    {location.latitude ?? '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                    {t('admin.locations.longitude', 'Longitude')}
                                </span>
                                <p className="font-mono text-sm mt-1">
                                    {location.longitude ?? '-'}
                                </p>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="space-y-2 pt-2 border-t">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('common.created_at', 'Created At')}
                                </span>
                                <span>{formatDate(location.createdAt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    {t('common.updated_at', 'Updated At')}
                                </span>
                                <span>{formatDate(location.updatedAt)}</span>
                            </div>
                        </div>

                        {/* ID (Optional for admin debugging) */}
                        <div className="pt-2 border-t text-xs text-muted-foreground font-mono">
                            ID: {location.id}
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                {t('common.close', 'Close')}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
