'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription
} from "@/components/ui/sheet";
import { ExploreFilters } from './ExploreFilters';
import type { EntityType } from './EntityTypeTabs';

interface ExploreMobileFiltersProps {
    type: EntityType;
}

export const ExploreMobileFilters = ({ type }: ExploreMobileFiltersProps) => {
    const { t } = useTranslation();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t('explore_page.filters.title', 'Filters')}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 overflow-y-auto">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>{t('explore_page.filters.title', 'Filters')}</SheetTitle>
                    <SheetDescription className="sr-only">
                        Filter available options
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <ExploreFilters
                        type={type}
                        className="border-none shadow-none sticky top-0 p-6 pt-0"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};
