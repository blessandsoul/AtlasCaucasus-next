'use client';

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Star, Wallet, Users, Eye } from 'lucide-react';
import { colors } from '@/lib/colors';
import type { EntityType } from './EntityTypeTabs';

export const ExploreHero = () => {
    const { t } = useTranslation();
    const pathname = usePathname();

    // Determine current type from URL path
    const pathParts = pathname.split('/');
    const currentType: EntityType = (pathParts[2] as EntityType) || 'tours';

    // Get dynamic title/subtitle keys
    const titleKey = currentType === 'tours' ? 'title' : `${currentType}_title`;
    const subtitleKey = currentType === 'tours' ? 'subtitle' : `${currentType}_subtitle`;

    const [randomImage, setRandomImage] = useState<string>('');

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * 10) + 1;
        setRandomImage(`/hero-backgrounds/${currentType}/${randomIndex}.png`);
    }, [currentType]);

    return (
        <section className="relative w-full pt-28 pb-16 text-white overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-gray-900">
                {randomImage && (
                    <img
                        src={randomImage}
                        alt="Explore Background"
                        className="h-full w-full object-cover opacity-80 animate-in fade-in duration-700"
                        style={{ objectPosition: 'center 30%' }}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col gap-6">
                    {/* Title and Subtitle */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md">
                            {t(`explore_page.hero.${titleKey}`)}
                        </h1>
                        <p className="text-white/90 text-lg max-w-2xl drop-shadow-sm">
                            {t(`explore_page.hero.${subtitleKey}`)}
                        </p>
                    </div>

                    {/* Tags and Stats Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-3">
                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors text-sm font-medium border border-white/10">
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                {t('explore_page.hero.tags.top_rated')}
                            </button>
                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors text-sm font-medium border border-white/10">
                                <Wallet className="w-4 h-4" style={{ color: colors.secondary }} />
                                {t('explore_page.hero.tags.budget')}
                            </button>
                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors text-sm font-medium border border-white/10">
                                <Users className="w-4 h-4 text-emerald-400" />
                                {t('explore_page.hero.tags.family')}
                            </button>
                        </div>

                        {/* Viewing Stat */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 self-start md:self-auto">
                            <Eye className="w-4 h-4" />
                            <span>933 {t('explore_page.hero.viewing')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
