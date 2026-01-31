'use client';

import { ShieldCheck, Tag, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const WhyChooseUsSection = () => {
    const { t } = useTranslation();

    const features = [
        {
            icon: <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
            title: t('home.why_choose.verified_guides'),
            desc: t('home.why_choose.verified_guides_desc'),
            delay: 0.1
        },
        {
            icon: <Tag className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
            title: t('home.why_choose.best_prices'),
            desc: t('home.why_choose.best_prices_desc'),
            delay: 0.2
        },
        {
            icon: <Users className="h-8 w-8 md:h-10 md:w-10 text-primary" />,
            title: t('home.why_choose.support'),
            desc: t('home.why_choose.support_desc'),
            delay: 0.3
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/10 to-background overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6 text-gradient leading-tight pb-2"
                    >
                        {t('home.why_choose.title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                    >
                        {t('home.why_choose.subtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: feature.delay }}
                            viewport={{ once: true }}
                            className="bg-card hover:bg-card/80 p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center h-full max-w-xl mx-auto lg:max-w-none w-full"
                        >
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-foreground">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
