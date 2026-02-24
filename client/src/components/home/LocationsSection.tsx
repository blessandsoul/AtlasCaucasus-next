'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocations } from '@/features/locations/hooks/useLocations';
import { useLocationStats } from '@/features/search/hooks/useSearch';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import type { Location } from '@/features/locations/types/location.types';

const LOCATION_IMAGES: Record<string, string> = {
    'Tbilisi': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1000&auto=format&fit=crop',
    'Batumi': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop',
    'Svaneti': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
    'Kazbegi': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
    'Kutaisi': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop',
    'Mestia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop',
    'Telavi': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop',
    'Signagi': 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1000&auto=format&fit=crop',
    'Borjomi': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop',
    'Gudauri': 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1000&auto=format&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop';

const GRID_CLASSES = [
    'col-span-2 md:col-span-2 lg:row-span-2 min-h-[240px] md:min-h-[200px]',
    'col-span-1 lg:col-span-2 2xl:col-span-1 min-h-[200px]',
    'col-span-1 2xl:row-span-2 min-h-[200px]',
    'col-span-2 lg:col-span-1 min-h-[200px]',
];

interface LocationCardProps {
    location: Location;
    className: string;
    index: number;
}

const LocationCard = ({ location, className, index }: LocationCardProps): React.ReactElement => {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: stats, isLoading: statsLoading } = useLocationStats(location.id);

    const image = LOCATION_IMAGES[location.name] || DEFAULT_IMAGE;
    const tourCount = stats?.tours ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={cn(
                'group relative overflow-hidden rounded-3xl cursor-pointer shimmer',
                className
            )}
            onClick={() => router.push(`${ROUTES.TOURS.LIST}?locationId=${location.id}`)}
        >
            <Image
                src={image}
                alt={location.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 text-white p-2 md:p-4 z-10">
                <h3 className="text-lg md:text-2xl font-bold mb-1 transform transition-transform duration-300 group-hover:-translate-y-1 leading-tight pb-1">
                    {location.name}
                </h3>
                <div className="flex items-center gap-2 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    {statsLoading ? (
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full h-5 w-16 animate-pulse" />
                    ) : (
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                            {t('home.destinations.tours_count', { count: tourCount })}
                        </span>
                    )}
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
        </motion.div>
    );
};

export const LocationsSection = (): React.ReactElement | null => {
    const { t } = useTranslation();
    const { data, isLoading } = useLocations({ limit: 4, isActive: true });
    const locations = data?.items || [];

    if (!isLoading && locations.length === 0) return null;

    return (
        <section className="py-12 md:py-24 container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 md:mb-10 text-center text-gradient leading-tight pb-2">
                {t('home.destinations.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 h-auto md:h-[600px]">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton
                              key={i}
                              className={cn('rounded-3xl', GRID_CLASSES[i])}
                          />
                      ))
                    : locations.slice(0, 4).map((location, index) => (
                          <LocationCard
                              key={location.id}
                              location={location}
                              className={GRID_CLASSES[index] || 'col-span-1 min-h-[200px]'}
                              index={index}
                          />
                      ))}
            </div>
        </section>
    );
};
