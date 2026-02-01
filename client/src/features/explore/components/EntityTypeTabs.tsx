'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type EntityType = 'tours' | 'hotels' | 'companies' | 'guides' | 'drivers';

interface TabConfig {
    value: EntityType;
    disabled?: boolean;
}

const TAB_CONFIG: TabConfig[] = [
    { value: 'tours' },
    { value: 'hotels', disabled: true },
    { value: 'companies' },
    { value: 'guides' },
    { value: 'drivers' },
];

export const EntityTypeTabs = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();

    // Determine current type from URL path
    const pathParts = pathname.split('/');
    const currentType: EntityType = (pathParts[2] as EntityType) || 'tours';

    const handleTabChange = (type: EntityType) => {
        router.push(`/explore/${type}`);
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-800">
            {/* Mobile Dropdown */}
            <div className="md:hidden pb-4">
                <Select
                    value={currentType}
                    onValueChange={(value) => handleTabChange(value as EntityType)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('explore_page.tabs.select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                        {TAB_CONFIG.map((tab) => (
                            <SelectItem
                                key={tab.value}
                                value={tab.value}
                                disabled={tab.disabled}
                            >
                                <span className="flex items-center">
                                    {t(`explore_page.tabs.${tab.value}`)}
                                    {tab.disabled && (
                                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">
                                            ({t('explore_page.tabs.coming_soon')})
                                        </span>
                                    )}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Tabs */}
            <nav className="hidden md:flex -mb-px space-x-8" aria-label="Entity types">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => !tab.disabled && handleTabChange(tab.value)}
                        disabled={tab.disabled}
                        className={cn(
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                            currentType === tab.value
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                            tab.disabled && 'cursor-not-allowed opacity-50'
                        )}
                        aria-current={currentType === tab.value ? 'page' : undefined}
                    >
                        {t(`explore_page.tabs.${tab.value}`)}
                        {tab.disabled && (
                            <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">
                                {t('explore_page.tabs.coming_soon')}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};
