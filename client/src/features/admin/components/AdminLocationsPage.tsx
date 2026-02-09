'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Plus } from 'lucide-react';

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

import { useLocations, useDeleteLocation } from '@/features/locations/hooks/useLocations';
import { EditLocationDialog } from '@/features/locations/components/EditLocationDialog';
import { LocationDetailsModal } from '@/features/locations/components/LocationDetailsModal';
import { formatDate } from '@/lib/utils/format';
import type { Location } from '@/features/locations/types/location.types';
import { DataTable } from '@/components/common/DataTable';
import type { ColumnDef } from '@/components/common/DataTable';
import { ErrorMessage } from '@/components/common/ErrorMessage';

const ITEMS_PER_PAGE = 10;

export const AdminLocationsPage = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Dialog state
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

    // Details modal state
    const [detailsLocationId, setDetailsLocationId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Delete dialog state
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: response, isLoading, error } = useLocations({
        page,
        limit: ITEMS_PER_PAGE,
        isActive: includeInactive ? undefined : true,
    });

    const deleteLocation = useDeleteLocation();

    const locations = response?.items || [];
    const pagination = response?.pagination;

    const handleCreate = useCallback(() => {
        setEditingLocation(null);
        setDialogMode('create');
        setIsEditDialogOpen(true);
    }, []);

    const handleEdit = useCallback((location: Location) => {
        setEditingLocation(location);
        setDialogMode('edit');
        setIsEditDialogOpen(true);
    }, []);

    const handleDeleteClick = useCallback((location: Location) => {
        setDeletingLocation(location);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deletingLocation) return;

        deleteLocation.mutate(deletingLocation.id, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingLocation(null);
            },
        });
    }, [deletingLocation, deleteLocation]);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleRowClick = useCallback((location: Location) => {
        setDetailsLocationId(location.id);
        setIsDetailsOpen(true);
    }, []);

    const columns: ColumnDef<Location>[] = useMemo(() => [
        {
            header: t('admin.locations.table.name'),
            cell: (location) => (
                <div className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {location.name}
                </div>
            ),
            className: "w-[200px]"
        },
        {
            header: t('admin.locations.table.region'),
            accessorKey: 'region',
            cell: (location) => location.region || '-'
        },
        {
            header: t('admin.locations.table.country'),
            accessorKey: 'country'
        },
        {
            header: t('admin.locations.table.coordinates'),
            cell: (location) => location.latitude && location.longitude ? (
                <span className="text-sm text-muted-foreground">
                    {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                </span>
            ) : '-'
        },
        {
            header: t('admin.locations.table.status'),
            cell: (location) => (
                <div className="flex justify-center">
                    <StatusIndicator isActive={location.isActive} />
                </div>
            ),
            className: "w-[100px] text-center"
        },
        {
            header: t('admin.locations.table.created'),
            cell: (location) => (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(location.createdAt)}
                </div>
            )
        }
    ], [t]);

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('admin.locations.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('admin.locations.subtitle')}
                    </p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.locations.add_new')}
                </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                    <Button
                        variant={!includeInactive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setIncludeInactive(false);
                            setPage(1);
                        }}
                        className="whitespace-nowrap"
                    >
                        {t('common.active')}
                    </Button>
                    <Button
                        variant={includeInactive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setIncludeInactive(true);
                            setPage(1);
                        }}
                        className="whitespace-nowrap"
                    >
                        {t('admin.locations.all_locations')}
                    </Button>
                </div>
                {pagination && (
                    <p className="text-sm text-muted-foreground">
                        {t('admin.locations.showing_count', {
                            count: locations.length,
                            total: pagination.totalItems,
                        })}
                    </p>
                )}
            </div>

            <DataTable
                data={locations}
                columns={columns}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onRowClick={handleRowClick}
                pagination={pagination && {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                    onPageChange: handlePageChange,
                    hasPreviousPage: pagination.hasPreviousPage,
                    hasNextPage: pagination.hasNextPage,
                    totalItems: pagination.totalItems
                }}
                emptyState={{
                    icon: MapPin,
                    title: t('admin.locations.empty_state')
                }}
            />

            {/* Edit/Create Location Dialog */}
            <EditLocationDialog
                location={editingLocation}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                mode={dialogMode}
            />

            {/* Location Details Modal */}
            <LocationDetailsModal
                locationId={detailsLocationId}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('admin.locations.delete_dialog.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.locations.delete_dialog.description', {
                                name: deletingLocation?.name,
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLocation.isPending}>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteLocation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteLocation.isPending
                                ? t('common.deleting')
                                : t('common.delete')
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
