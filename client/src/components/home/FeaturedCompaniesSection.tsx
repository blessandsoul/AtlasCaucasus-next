'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyCard } from '@/features/companies/components/CompanyCard';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { ROUTES } from '@/lib/constants/routes';

export const FeaturedCompaniesSection = (): React.ReactElement | null => {
    const { t } = useTranslation();
    const { data, isLoading } = useCompanies({ limit: 4, sortBy: 'rating' });
    const companies = data?.items || [];

    if (!isLoading && companies.length === 0) return null;

    return (
        <section className="py-12 bg-background">
            <div className="container mx-auto px-4">
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gradient leading-tight pb-2">
                            {t('home.companies.title')}
                        </h2>
                        <p className="text-muted-foreground">{t('home.companies.subtitle')}</p>
                    </div>
                    <Link
                        href={ROUTES.EXPLORE.COMPANIES}
                        className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        {t('home.companies.view_all')}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <Skeleton key={i} className="h-[380px] w-full rounded-2xl" />
                          ))
                        : companies.map((company, i) => (
                              <motion.div
                                  key={company.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  viewport={{ once: true }}
                              >
                                  <CompanyCard company={company} className="h-full" />
                              </motion.div>
                          ))}
                </div>

                <Link
                    href={ROUTES.EXPLORE.COMPANIES}
                    className="flex sm:hidden items-center justify-center gap-1 mt-8 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {t('home.companies.view_all')}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
};
