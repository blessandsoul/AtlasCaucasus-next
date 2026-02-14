'use client';

import Link from 'next/link';
import { useTranslation, Trans } from 'react-i18next';

export default function CookiePolicyClient() {
    const { t } = useTranslation();
    const strongComponent = <strong className="text-foreground" />;
    const privacyLink = <Link href="/legal/privacy" className="text-primary hover:underline" />;
    const termsLink = <Link href="/legal/terms" className="text-primary hover:underline" />;

    return (
        <article className="space-y-8">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('legal.cookies.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('legal.cookies.last_updated', { date: 'February 8, 2026' })}</p>
            </header>

            <p className="text-muted-foreground leading-relaxed">
                {t('legal.cookies.intro')}
            </p>

            {/* 1. What Are Cookies */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.what_are.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.what_are.text')}
                </p>
            </section>

            {/* 2. Cookies We Use */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.cookies_we_use.title')}</h2>

                <div className="space-y-6">
                    {/* Essential */}
                    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                        <h3 className="font-medium">{t('legal.cookies.sections.cookies_we_use.essential.title')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('legal.cookies.sections.cookies_we_use.essential.text')}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 pr-4 font-medium">{t('legal.cookies.sections.cookies_we_use.essential.table.header.cookie')}</th>
                                        <th className="text-left py-2 pr-4 font-medium">{t('legal.cookies.sections.cookies_we_use.essential.table.header.purpose')}</th>
                                        <th className="text-left py-2 font-medium">{t('legal.cookies.sections.cookies_we_use.essential.table.header.duration')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border/50">
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.auth.name')}</td>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.auth.purpose')}</td>
                                        <td className="py-2">{t('legal.cookies.sections.cookies_we_use.essential.table.auth.duration')}</td>
                                    </tr>
                                    <tr className="border-b border-border/50">
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.refresh.name')}</td>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.refresh.purpose')}</td>
                                        <td className="py-2">{t('legal.cookies.sections.cookies_we_use.essential.table.refresh.duration')}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.csrf.name')}</td>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.essential.table.csrf.purpose')}</td>
                                        <td className="py-2">{t('legal.cookies.sections.cookies_we_use.essential.table.csrf.duration')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Functional */}
                    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                        <h3 className="font-medium">{t('legal.cookies.sections.cookies_we_use.functional.title')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('legal.cookies.sections.cookies_we_use.functional.text')}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 pr-4 font-medium">{t('legal.cookies.sections.cookies_we_use.functional.table.header.cookie')}</th>
                                        <th className="text-left py-2 pr-4 font-medium">{t('legal.cookies.sections.cookies_we_use.functional.table.header.purpose')}</th>
                                        <th className="text-left py-2 font-medium">{t('legal.cookies.sections.cookies_we_use.functional.table.header.duration')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border/50">
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.functional.table.language.name')}</td>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.functional.table.language.purpose')}</td>
                                        <td className="py-2">{t('legal.cookies.sections.cookies_we_use.functional.table.language.duration')}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.functional.table.theme.name')}</td>
                                        <td className="py-2 pr-4">{t('legal.cookies.sections.cookies_we_use.functional.table.theme.purpose')}</td>
                                        <td className="py-2">{t('legal.cookies.sections.cookies_we_use.functional.table.theme.duration')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Local Storage */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.local_storage.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.local_storage.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li><Trans i18nKey="legal.cookies.sections.local_storage.list.auth" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.cookies.sections.local_storage.list.prefs" components={{ strong: strongComponent }} /></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.local_storage.text')}
                </p>
            </section>

            {/* 4. Third Party */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.third_party.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.third_party.text')}
                </p>
            </section>

            {/* 5. Managing */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.managing.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.managing.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.cookies.sections.managing.list.view')}</li>
                    <li>{t('legal.cookies.sections.managing.list.block')}</li>
                    <li>{t('legal.cookies.sections.managing.list.preferences')}</li>
                    <li>{t('legal.cookies.sections.managing.list.notifications')}</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.managing.note')}
                </p>
            </section>

            {/* 6. Changes */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.changes.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.changes.text')}
                </p>
            </section>

            {/* 7. Contact */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.cookies.sections.contact.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.cookies.sections.contact.text')}
                </p>
                <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">AtlasCaucasus.GE</strong></p>
                    <p>123 Rustaveli Avenue, Tbilisi, Georgia</p>
                    <p>Email: info@atlascaucasus.com</p>
                    <p>Phone: +995 555 123 456</p>
                </div>
            </section>

            {/* Links */}
            <section className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                    <Trans
                        i18nKey="legal.cookies.sections.links.text"
                        components={{ 1: privacyLink, 2: termsLink }}
                    />
                </p>
            </section>
        </article>
    );
}
