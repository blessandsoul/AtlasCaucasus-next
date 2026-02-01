'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background border-t">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <img src="/atlascaucasus.png" alt={t('header.brand.name')} className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg leading-none">{t('header.brand.name')}</h3>
                                <span className="text-[10px] text-muted-foreground font-medium">{t('header.brand.slogan')}</span>
                            </div>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('header.footer.desc')}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold">{t('header.nav.explore')}</h4>
                        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href="/explore/tours" className="hover:text-primary transition-colors">
                                {t('header.nav_menu.items.tour')}
                            </Link>
                            <Link href="/explore/companies" className="hover:text-primary transition-colors">
                                {t('header.nav_menu.items.companies')}
                            </Link>
                            <Link href="/explore/guides" className="hover:text-primary transition-colors">
                                {t('header.nav_menu.items.guides')}
                            </Link>
                            <Link href="/explore/drivers" className="hover:text-primary transition-colors">
                                {t('header.nav_menu.items.drivers')}
                            </Link>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold">{t('header.footer.contact_us')}</h4>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                <span>123 Rustaveli Avenue,<br />Tbilisi, Georgia</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 shrink-0 text-primary" />
                                <span>+995 555 123 456</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 shrink-0 text-primary" />
                                <span>info@atlascaucasus.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-semibold">{t('header.footer.newsletter')}</h4>
                        <p className="text-sm text-muted-foreground">
                            {t('header.footer.newsletter_desc')}
                        </p>
                        <div className="flex flex-col gap-2">
                            <Input placeholder={t('header.footer.enter_email')} type="email" />
                            <Button className="w-full">{t('header.footer.subscribe')}</Button>
                        </div>
                    </div>
                </div>

                <hr className="my-8 border-border" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p className="text-center md:text-left">© {currentYear} {t('header.brand.name')}. {t('header.footer.rights_reserved')}</p>
                    <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
                        <Link href="#" className="hover:text-foreground transition-colors">{t('header.footer.privacy_policy')}</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">{t('header.footer.terms_of_service')}</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">{t('header.footer.cookie_policy')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
