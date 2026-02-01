'use client';

import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const CTASection = () => {
    const { t } = useTranslation();

    // CTA Parallax effect
    const { scrollYProgress } = useScroll();
    const ctaY = useTransform(scrollYProgress, [0.8, 1], [0, -100]);

    return (
        <section className="min-h-[600px] relative flex items-center justify-center overflow-hidden">
            <motion.div
                style={{ y: ctaY }}
                className="absolute inset-0 w-full h-[120%]"
            >
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Chaukhi_Mountain_%26_Tina_Lake%2C_Juta_Valley%2C_Mtskheta-Mtianeti%2C_Georgia.jpg/2560px-Chaukhi_Mountain_%26_Tina_Lake%2C_Juta_Valley%2C_Mtskheta-Mtianeti%2C_Georgia.jpg"
                    alt="Chaukhi Mountain & Tina Lake"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="container mx-auto px-4 relative z-10 text-center"
            >
                <h2 className="text-2xl min-[420px]:text-4xl md:text-6xl font-bold text-white mb-8 drop-shadow-lg leading-tight pb-2">
                    {t('home.cta.title')}
                </h2>
                <p className="text-white/90 text-xl max-w-2xl mx-auto mb-10 drop-shadow-md">
                    {t('home.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Button
                        size="lg"
                        className="rounded-full text-lg h-14 px-10 shadow-xl hover:scale-105 transition-transform"
                        asChild
                    >
                        <Link href="/register">
                            {t('home.cta.get_started')}
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full text-lg h-14 px-10 bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white hover:scale-105 transition-all backdrop-blur-md"
                        asChild
                    >
                        <Link href="/explore/tours">
                            {t('home.cta.browse_tours')}
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </section>
    );
};
