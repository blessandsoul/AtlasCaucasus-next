'use client';

import { Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const PromotionalBanner = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full py-4 relative overflow-hidden flex items-center min-h-[124px] bg-gradient-to-r from-[#17ad80] to-[#2cd4bf]">
            <div className="max-w-[900px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-white p-2.5 rounded-full shadow-lg relative shrink-0 group">
                        <Crown className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm animate-pulse">
                            <Sparkles className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="bg-white/25 text-[10px] font-bold px-2 py-0.5 rounded-full text-white border border-white/20 uppercase tracking-wider backdrop-blur-md shadow-sm">
                                {t('home.promotional_banner.new_badge')}
                            </span>
                            <span className="font-bold text-lg leading-tight tracking-tight pb-0.5">
                                {t('home.promotional_banner.title')}
                            </span>
                        </div>
                        <p className="text-emerald-50 text-sm font-medium leading-relaxed opacity-95">
                            {t('home.promotional_banner.description')}
                        </p>
                    </div>
                </div>

                <Button
                    className="bg-white text-emerald-600 hover:bg-emerald-50 border-none shrink-0 font-semibold shadow-md transition-all hover:shadow-lg active:scale-95"
                >
                    {t('home.promotional_banner.cta_button')} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
};
