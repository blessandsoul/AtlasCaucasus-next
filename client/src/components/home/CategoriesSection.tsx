'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mountain, Wine, Tent, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export const CategoriesSection = () => {
    const { t } = useTranslation();

    const categories = useMemo(() => [
        { id: 'hiking', icon: <Mountain />, color: "bg-emerald-100 text-emerald-600" },
        { id: 'wine', icon: <Wine />, color: "bg-rose-100 text-rose-600" },
        { id: 'culture', icon: <Tent />, color: "bg-amber-100 text-amber-600" },
        { id: 'sea', icon: <Waves />, color: "bg-blue-100 text-blue-600" },
        { id: 'adventure', icon: <Mountain />, color: "bg-stone-100 text-stone-600" },
    ], []);

    return (
        <section className="py-16 container mx-auto px-4">
            <div className="text-center mb-12">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gradient leading-tight pb-2"
                >
                    {t('home.categories.title')}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-muted-foreground"
                >
                    {t('home.categories.subtitle')}
                </motion.p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                {categories.map((cat, i) => (
                    <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl relative",
                            "before:absolute before:inset-[-3px] before:rounded-full before:bg-gradient-to-r before:from-primary before:via-cyan-400 before:to-primary before:opacity-0 before:group-hover:opacity-100 before:transition-opacity before:duration-300 before:-z-10",
                            cat.color
                        )}>
                            {cat.icon}
                        </div>
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {t(`home.categories.items.${cat.id}`)}
                        </span>
                    </motion.button>
                ))}
            </div>
        </section>
    );
};
