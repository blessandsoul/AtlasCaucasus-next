'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mountain, Wine, Tent, Waves, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export const CategoriesSection = () => {
    const { t } = useTranslation();

    const categories = useMemo(() => [
        {
            id: 'hiking',
            icon: <Mountain className="w-6 h-6" />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "group-hover:border-emerald-200"
        },
        {
            id: 'wine',
            icon: <Wine className="w-6 h-6" />,
            color: "text-rose-600",
            bg: "bg-rose-50",
            border: "group-hover:border-rose-200"
        },
        {
            id: 'culture',
            icon: <Tent className="w-6 h-6" />,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "group-hover:border-amber-200"
        },
        {
            id: 'sea',
            icon: <Waves className="w-6 h-6" />,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "group-hover:border-blue-200"
        },
        {
            id: 'adventure',
            icon: <Map className="w-6 h-6" />,
            color: "text-stone-600",
            bg: "bg-stone-50",
            border: "group-hover:border-stone-200"
        },
    ], []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section className="py-20 md:py-24 container mx-auto px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10" />

            <div className="text-center mb-16 max-w-2xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gradient leading-normal py-2"
                >
                    {t('home.categories.title')}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-muted-foreground text-lg"
                >
                    {t('home.categories.subtitle')}
                </motion.p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="flex flex-wrap justify-center gap-4 md:gap-6"
            >
                {categories.map((cat) => (
                    <motion.div
                        key={cat.id}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className={cn(
                            "group relative flex flex-col items-center p-6 md:p-8 rounded-2xl transition-all duration-300",
                            "bg-card/50 hover:bg-card border border-border/50 hover:shadow-lg",
                            "backdrop-blur-sm",
                            // Responsive width calculations:
                            // < 420px (1 col): w-full
                            // >= 420px (2 cols): calc(50% - gap/2)
                            // Tablet (3 cols): calc(33.33% - gap*2/3)
                            // Desktop (5 cols): calc(20% - gap*4/5)
                            "w-full min-[420px]:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)]",
                            cat.border
                        )}
                    >
                        {/* Icon Circle */}
                        <div className={cn(
                            "w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                            cat.bg,
                            cat.color
                        )}>
                            {cat.icon}
                        </div>

                        {/* Text */}
                        <h3 className="font-semibold text-lg text-center mb-2 text-foreground group-hover:text-primary transition-colors">
                            {t(`home.categories.items.${cat.id}`)}
                        </h3>



                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};
