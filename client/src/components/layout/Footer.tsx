'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidGeorgianPhone } from '@/lib/utils/validation';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

export const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    // LocalStorage helpers for duplicate prevention
    const PHONE_SUBMISSIONS_KEY = 'footer_phone_submissions';
    const SUBMISSION_EXPIRY_DAYS = 30;

    const hasRecentlySubmitted = (phone: string): boolean => {
        try {
            const submissions = JSON.parse(localStorage.getItem(PHONE_SUBMISSIONS_KEY) || '[]');
            const recentSubmission = submissions.find(
                (sub: { phone: string; timestamp: number }) =>
                    sub.phone === phone &&
                    Date.now() - sub.timestamp < SUBMISSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
            );
            return !!recentSubmission;
        } catch {
            return false;
        }
    };

    const savePhoneSubmission = (phone: string): void => {
        try {
            const submissions = JSON.parse(localStorage.getItem(PHONE_SUBMISSIONS_KEY) || '[]');
            submissions.push({ phone, timestamp: Date.now() });
            localStorage.setItem(PHONE_SUBMISSIONS_KEY, JSON.stringify(submissions));
        } catch (error) {
            console.error('Failed to save phone submission:', error);
        }
    };

    // Form state and validation
    const [isSubmitting, setIsSubmitting] = useState(false);

    const phoneSchema = z.object({
        phoneNumber: z
            .string()
            .min(1, t('header.footer.phone_required'))
            .refine(isValidGeorgianPhone, {
                message: t('header.footer.phone_invalid'),
            }),
    });

    type PhoneFormData = z.infer<typeof phoneSchema>;

    const form = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
        defaultValues: {
            phoneNumber: '',
        },
    });

    const onSubmit = async (data: PhoneFormData) => {
        setIsSubmitting(true);

        try {
            // Check for recent submission
            if (hasRecentlySubmitted(data.phoneNumber)) {
                toast.error(t('header.footer.already_submitted'));
                setIsSubmitting(false);
                return;
            }

            // Save to localStorage (client-side only)
            savePhoneSubmission(data.phoneNumber);

            // Show success message
            toast.success(t('header.footer.phone_submitted_success'));

            // Reset form
            form.reset();
        } catch (error) {
            toast.error(t('header.footer.submission_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="relative bg-gradient-to-b from-background via-background to-primary/5 border-t overflow-hidden">
            {/* Floating decorative blobs */}
            <div className="floating-blob w-96 h-96 bg-primary/20 -bottom-20 -left-32" />
            <div className="floating-blob w-64 h-64 bg-cyan-400/20 -top-20 -right-20" style={{ animationDelay: '3s' }} />

            <div className="container mx-auto px-6 py-16 relative z-10">
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
                        <div className="flex items-center gap-5 mt-2">
                            <a href="#" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all hover:shadow-lg hover:shadow-primary/30 rounded-full p-2 hover:bg-primary/5">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all hover:shadow-lg hover:shadow-primary/30 rounded-full p-2 hover:bg-primary/5">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all hover:shadow-lg hover:shadow-primary/30 rounded-full p-2 hover:bg-primary/5">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all hover:shadow-lg hover:shadow-primary/30 rounded-full p-2 hover:bg-primary/5">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg">{t('header.nav.explore')}</h4>
                        <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <Link href="/explore/tours" className="hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                                <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                                {t('header.nav_menu.items.tour')}
                            </Link>
                            <Link href="/explore/companies" className="hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                                <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                                {t('header.nav_menu.items.companies')}
                            </Link>
                            <Link href="/explore/guides" className="hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                                <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                                {t('header.nav_menu.items.guides')}
                            </Link>
                            <Link href="/explore/drivers" className="hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-2 group">
                                <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                                {t('header.nav_menu.items.drivers')}
                            </Link>
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-lg">{t('header.footer.contact_us')}</h4>
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
                        <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                            <h4 className="font-bold text-lg mb-2">{t('header.footer.newsletter')}</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('header.footer.newsletter_desc')}
                            </p>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t('header.footer.enter_phone')}
                                                        type="tel"
                                                        className="border-primary/20 focus:border-primary bg-background/50"
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('header.footer.subscribe')}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>

                <hr className="my-8 border-border" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p className="text-center md:text-left font-medium">© {currentYear} {t('header.brand.name')}. {t('header.footer.rights_reserved')}</p>
                    <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
                        <Link href="#" className="hover:text-primary hover:underline underline-offset-4 transition-all">{t('header.footer.privacy_policy')}</Link>
                        <Link href="#" className="hover:text-primary hover:underline underline-offset-4 transition-all">{t('header.footer.terms_of_service')}</Link>
                        <Link href="#" className="hover:text-primary hover:underline underline-offset-4 transition-all">{t('header.footer.cookie_policy')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
