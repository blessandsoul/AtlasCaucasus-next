'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { label: t('about.stats.active_tours'), value: '500+', icon: MapPin },
    { label: t('about.stats.local_guides'), value: '200+', icon: Users },
    { label: t('about.stats.destinations'), value: '50+', icon: Award },
    { label: t('about.stats.happy_travelers'), value: '10K+', icon: TrendingUp },
  ];

  const team = [
    {
      name: 'Sarah Anderson',
      role: t('about.team.roles.ceo'),
      bio: t('about.team.bios.sarah'),
      image: '/team/placeholder-1.jpg', // Placeholder
    },
    {
      name: 'David Chavchavadze',
      role: t('about.team.roles.cto'),
      bio: t('about.team.bios.david'),
      image: '/team/placeholder-2.jpg', // Placeholder
    },
    {
      name: 'Maria Nikolaishvili',
      role: t('about.team.roles.ops'),
      bio: t('about.team.bios.maria'),
      image: '/team/placeholder-3.jpg', // Placeholder
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              {t('about.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {t('about.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">{t('about.mission.title')}</h2>

            <div className="prose prose-lg max-w-none space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t('about.mission.p1')}
              </p>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.mission.p2')}
              </p>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.mission.p3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('about.team.title')}</h2>
              <p className="text-muted-foreground text-lg">
                {t('about.team.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="flex flex-col items-center text-center p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-32 h-32 rounded-full bg-primary/10 mb-4 flex items-center justify-center overflow-hidden">
                    <Users className="h-16 w-16 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">{t('about.cta.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('about.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href={ROUTES.EXPLORE.TOURS}>
                <Button size="lg" className="gap-2">
                  {t('about.cta.browse_tours')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={ROUTES.EXPLORE.GUIDES}>
                <Button size="lg" variant="outline" className="gap-2">
                  {t('about.cta.find_guide')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
