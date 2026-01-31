'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

export const DestinationsSection = () => {
    const { t } = useTranslation();
    const router = useRouter();

    const destinations = [
        {
            name: "Svaneti",
            image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1000&auto=format&fit=crop",
            tours: 124,
            className: "col-span-2 md:col-span-2 md:row-span-1 lg:row-span-2 min-h-[240px] md:min-h-[200px]"
        },
        {
            name: "Tbilisi",
            image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
            tours: 85,
            className: "col-span-1 md:col-span-1 lg:col-span-2 2xl:col-span-1 md:row-span-1 min-h-[200px]"
        },
        {
            name: "Batumi",
            image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop",
            tours: 42,
            className: "col-span-1 md:col-span-1 md:row-span-1 2xl:row-span-2 min-h-[200px]"
        },
        {
            name: "Kazbegi",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
            tours: 56,
            className: "col-span-2 md:col-span-2 lg:col-span-1 md:row-span-1 min-h-[200px]"
        }
    ];

    return (
        <section className="py-12 md:py-24 container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 md:mb-10 text-center text-gradient leading-tight pb-2">
                {t('home.destinations.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 h-auto md:h-[600px]">
                {destinations.map((dest, index) => (
                    <motion.div
                        key={dest.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={cn(
                            "group relative overflow-hidden rounded-3xl cursor-pointer shimmer",
                            dest.className
                        )}
                        onClick={() => router.push(`${ROUTES.TOURS.LIST}?city=${dest.name}`)}
                    >
                        <Image
                            src={dest.image}
                            alt={dest.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                        <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 text-white p-2 md:p-4 z-10">
                            <h3 className="text-lg md:text-2xl font-bold mb-1 transform transition-transform duration-300 group-hover:-translate-y-1 leading-tight pb-1">
                                {dest.name}
                            </h3>
                            <div className="flex items-center gap-2 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                                    {t('home.destinations.tours_count', { count: dest.tours })}
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
