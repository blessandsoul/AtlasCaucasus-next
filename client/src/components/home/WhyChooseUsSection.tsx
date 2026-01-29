'use client';

import { ShieldCheck, Tag, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const WhyChooseUsSection = () => {
    const { t } = useTranslation();

    const features = [
        {
            icon: <ShieldCheck className="h-10 w-10 text-primary" />,
            title: t('home.why_choose.verified_guides'),
            desc: t('home.why_choose.verified_guides_desc'),
            delay: 0.1
        },
        {
            icon: <Tag className="h-10 w-10 text-primary" />,
            title: t('home.why_choose.best_prices'),
            desc: t('home.why_choose.best_prices_desc'),
            delay: 0.2
        },
        {
            icon: <Users className="h-10 w-10 text-primary" />,
            title: t('home.why_choose.support'),
            desc: t('home.why_choose.support_desc'),
            delay: 0.3
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient leading-tight pb-2">
                        {t('home.why_choose.title')}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        {t('home.why_choose.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: feature.delay }}
                            viewport={{ once: true }}
                            className="bg-card p-8 rounded-3xl border shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
                        >
                            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 leading-tight pb-1">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
