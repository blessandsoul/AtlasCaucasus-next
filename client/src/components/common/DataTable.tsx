'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, FileQuestion, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface ColumnDef<T> {
    header: string | ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    pagination?: {
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        totalItems?: number;
    };
    emptyState?: {
        icon?: React.ElementType;
        title?: string;
        description?: string;
        action?: ReactNode;
    };
    className?: string;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    isLoading,
    onRowClick,
    onEdit,
    onDelete,
    pagination,
    emptyState,
    className,
}: DataTableProps<T>) {
    const { t } = useTranslation();

    const activeColumns = (onEdit || onDelete) ? [
        ...columns,
        {
            header: t('common.actions'),
            align: 'right',
            className: "w-[100px]",
            cell: (item: T) => (
                <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                            title={t('common.edit', 'Edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={t('common.delete', 'Delete')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        } as ColumnDef<T>
    ] : columns;

    if (isLoading) {
        return (
            <div className="w-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            <Card className="shadow-sm border-muted/60">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/30">
                                {activeColumns.map((column, index) => (
                                    <TableHead
                                        key={index}
                                        className={cn(
                                            column.className,
                                            column.align === 'right' && "text-right",
                                            column.align === 'center' && "text-center"
                                        )}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={activeColumns.length}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            {emptyState?.icon ? (
                                                <emptyState.icon className="h-8 w-8 opacity-20" />
                                            ) : (
                                                <FileQuestion className="h-8 w-8 opacity-20" />
                                            )}
                                            <p>{emptyState?.title || t('common.no_data', 'No data found')}</p>
                                            {emptyState?.description && (
                                                <p className="text-sm font-normal text-muted-foreground/80">
                                                    {emptyState.description}
                                                </p>
                                            )}
                                            {emptyState?.action && (
                                                <div className="mt-2">{emptyState.action}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className={cn("group", onRowClick && "cursor-pointer hover:bg-muted/50")}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {activeColumns.map((column, index) => (
                                            <TableCell
                                                key={index}
                                                className={cn(
                                                    column.className,
                                                    column.align === 'right' && "text-right",
                                                    column.align === 'center' && "text-center"
                                                )}
                                            >
                                                {column.cell
                                                    ? column.cell(item)
                                                    : column.accessorKey
                                                        ? (item[column.accessorKey] as ReactNode)
                                                        : null}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        disabled={!pagination.hasPreviousPage}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {t('common.pagination.page_of', 'Page {{page}} of {{total}}', {
                            page: pagination.page,
                            total: pagination.totalPages,
                        })}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
