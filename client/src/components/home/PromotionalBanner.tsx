'use client';

import { Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const PromotionalBanner = () => {
    const { t } = useTranslation();

    return (
        <section className="w-full relative overflow-hidden">
            {/* Background with overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 opacity-90" />

            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-white/5 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-white/10 shadow-xl">

                    {/* Content Section */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left flex-1 w-full">

                        {/* Icon Wrapper */}
                        <div className="relative shrink-0 group">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                            <div className="bg-white p-3.5 rounded-full shadow-lg relative z-10 ring-4 ring-white/10 transition-transform duration-300 group-hover:scale-105">
                                <Crown className="w-7 h-7 text-emerald-600" />
                                <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-1 shadow-sm animate-pulse ring-2 ring-emerald-500">
                                    <Sparkles className="w-3 h-3 text-white fill-white" />
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 shadow-sm uppercase tracking-wide">
                                    {t('home.promotional_banner.new_badge')}
                                </span>
                                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                                    {t('home.promotional_banner.title')}
                                </h2>
                            </div>
                            <p className="text-emerald-50 text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0 opacity-90">
                                {t('home.promotional_banner.description')}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="w-full md:w-auto shrink-0">
                        <Button
                            size="lg"
                            className="w-full md:w-auto bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-none font-bold shadow-lg shadow-emerald-900/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-base px-8 h-12 md:h-14"
                        >
                            <span className="mr-2">{t('home.promotional_banner.cta_button')}</span>
                            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};
