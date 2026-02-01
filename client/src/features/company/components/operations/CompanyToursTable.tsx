'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Calendar } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useMyTours, useDeleteTour } from '@/features/tours/hooks/useTours';
import { EditTourDialog } from '@/features/tours/components/EditTourDialog';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import type { Tour } from '@/features/tours/types/tour.types';
import { DataTable } from '@/components/common/DataTable';
import type { ColumnDef } from '@/components/common/DataTable';
import { ErrorMessage } from '@/components/common/ErrorMessage';

const ITEMS_PER_PAGE = 10;

export const CompanyToursTable = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Edit dialog state
    const [editingTour, setEditingTour] = useState<Tour | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Delete dialog state
    const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: response, isLoading, error } = useMyTours({
        page,
        limit: ITEMS_PER_PAGE,
        includeInactive,
    });

    const deleteTour = useDeleteTour();

    const tours = response?.items || [];
    const pagination = response?.pagination;

    const handleEdit = useCallback((tour: Tour) => {
        setEditingTour(tour);
        setIsEditDialogOpen(true);
    }, []);

    const handleDeleteClick = useCallback((tour: Tour) => {
        setDeletingTour(tour);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deletingTour) return;

        deleteTour.mutate(deletingTour.id, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingTour(null);
            },
        });
    }, [deletingTour, deleteTour]);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const columns: ColumnDef<Tour>[] = useMemo(() => [
        {
            header: t('company.operations.tours.table.title', 'Title'),
            cell: (tour) => (
                <div className="font-medium">
                    <Link href={ROUTES.TOURS.DETAILS(tour.id)} className="hover:underline flex items-center gap-2">
                        <span>{tour.title}</span>
                    </Link>
                </div>
            ),
            className: "w-[300px]"
        },
        {
            header: t('company.operations.tours.table.location', 'Location'),
            cell: (tour) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Map className="h-3.5 w-3.5" />
                    {tour.city || '-'}
                </div>
            )
        },
        {
            header: t('company.operations.tours.table.price', 'Price'),
            cell: (tour) => (
                <div className="font-medium">
                    {formatCurrency(Number(tour.price), tour.currency)}
                </div>
            )
        },
        {
            header: t('company.operations.tours.table.status', 'Status'),
            cell: (tour) => (
                <div className="flex justify-center">
                    <StatusIndicator isActive={tour.isActive} />
                </div>
            ),
            className: "w-[100px] text-center"
        },
        {
            header: t('company.operations.tours.table.created', 'Created'),
            cell: (tour) => (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(tour.createdAt)}
                </div>
            )
        }
    ], [t]);

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div className="space-y-6">
            {/* Filter controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={!includeInactive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setIncludeInactive(false);
                            setPage(1);
                        }}
                    >
                        {t('common.active', 'Active')}
                    </Button>
                    <Button
                        variant={includeInactive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setIncludeInactive(true);
                            setPage(1);
                        }}
                    >
                        {t('tours.all_tours', 'All Tours')}
                    </Button>
                </div>
                {pagination && (
                    <p className="text-sm text-muted-foreground">
                        {t('tours.showing_count', 'Showing {{count}} of {{total}} tours', {
                            count: tours.length,
                            total: pagination.totalItems,
                        })}
                    </p>
                )}
            </div>

            <DataTable
                data={tours}
                columns={columns}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                pagination={pagination && {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                    onPageChange: handlePageChange,
                    hasPreviousPage: pagination.hasPreviousPage,
                    hasNextPage: pagination.hasNextPage,
                    totalItems: pagination.totalItems
                }}
                emptyState={{
                    icon: Map,
                    title: t('company.operations.tours.empty_state', 'No tours found')
                }}
            />

            {/* Edit Tour Dialog */}
            <EditTourDialog
                tour={editingTour}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('tours.delete_dialog.title', 'Delete Tour')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('tours.delete_dialog.description', 'Are you sure you want to delete "{{title}}"? This action will deactivate the tour and it will no longer be visible to customers.', {
                                title: deletingTour?.title,
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteTour.isPending}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteTour.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteTour.isPending
                                ? t('common.deleting', 'Deleting...')
                                : t('common.delete', 'Delete')
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
