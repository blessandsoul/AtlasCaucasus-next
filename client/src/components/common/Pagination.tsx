'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onChange: (page: number) => void;
}

export const Pagination = ({
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    onChange
}: PaginationProps) => {
    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(page - 1)}
                disabled={!hasPreviousPage}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
                Page {page} of {totalPages}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(page + 1)}
                disabled={!hasNextPage}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};
