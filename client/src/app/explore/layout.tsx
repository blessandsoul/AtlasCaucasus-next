'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ExploreHero } from '@/features/explore/components/ExploreHero';
import { EntityTypeTabs, type EntityType } from '@/features/explore/components/EntityTypeTabs';
import { ExploreFilters } from '@/features/explore/components/ExploreFilters';

/**
 * ExploreLayout - Shared layout for /explore/* routes
 * Contains the hero section, tabs, and persistent sidebar filters
 * Detail pages (with IDs) bypass the filter layout
 */
export default function ExploreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Scroll to top on route change (including pagination/filters)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pathname, searchParams]);

    // Determine current type from URL path for the filters
    const pathParts = pathname.split('/');
    // e.g. /explore/tours -> parts=["", "explore", "tours"]
    // e.g. /explore/drivers/123 -> parts=["", "explore", "drivers", "123"]
    const currentType: EntityType = (pathParts[2] as EntityType) || 'tours';

    // Check if this is a detail page (has an ID segment - 4th part)
    const isDetailPage = pathParts.length > 3 && pathParts[3];

    // Detail pages render without the explore layout wrapper
    if (isDetailPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-gray-950">
            <ExploreHero />

            <div className="container mx-auto px-4 pt-6">
                <EntityTypeTabs />
            </div>

            <div className="container mx-auto py-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Sidebar Filters - Persistent across sub-routes */}
                    <div className="lg:col-span-1 hidden lg:block">
                        <ExploreFilters type={currentType} />
                    </div>

                    {/* Main Content Area */}
                    {children}
                </div>
            </div>
        </div>
    );
}
