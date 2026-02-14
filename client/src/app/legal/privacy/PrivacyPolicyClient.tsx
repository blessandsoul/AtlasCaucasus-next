'use client';

import Link from 'next/link';
import { useTranslation, Trans } from 'react-i18next';

export default function PrivacyPolicyClient() {
    const { t } = useTranslation();

    const strongComponent = <strong className="text-foreground" />;
    const cookieLink = <Link href="/legal/cookies" className="text-primary hover:underline" />;

    return (
        <article className="space-y-8">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('legal.privacy.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('legal.privacy.last_updated', { date: 'February 8, 2026' })}</p>
            </header>

            <p className="text-muted-foreground leading-relaxed">
                {t('legal.privacy.intro')}
            </p>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.collection.title')}</h2>

                <div className="space-y-3">
                    <h3 className="font-medium">{t('legal.privacy.sections.collection.provided.title')}</h3>
                    <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.account" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.profile" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.company" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.communication" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.listings" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.provided.reviews" components={{ strong: strongComponent }} /></li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium">{t('legal.privacy.sections.collection.automatic.title')}</h3>
                    <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                        <li><Trans i18nKey="legal.privacy.sections.collection.automatic.usage" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.automatic.device" components={{ strong: strongComponent }} /></li>
                        <li><Trans i18nKey="legal.privacy.sections.collection.automatic.ip" components={{ strong: strongComponent }} /></li>
                        <li>
                            <Trans
                                i18nKey="legal.privacy.sections.collection.automatic.cookies"
                                components={{ strong: strongComponent, 1: cookieLink }}
                            />
                        </li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.usage.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('legal.privacy.sections.usage.intro')}</p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.privacy.sections.usage.list.account')}</li>
                    <li>{t('legal.privacy.sections.usage.list.communicate')}</li>
                    <li>{t('legal.privacy.sections.usage.list.display')}</li>
                    <li>{t('legal.privacy.sections.usage.list.transactional')}</li>
                    <li>{t('legal.privacy.sections.usage.list.notifications')}</li>
                    <li>{t('legal.privacy.sections.usage.list.improve')}</li>
                    <li>{t('legal.privacy.sections.usage.list.fraud')}</li>
                    <li>{t('legal.privacy.sections.usage.list.legal')}</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.sharing.title')}</h2>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li><Trans i18nKey="legal.privacy.sections.sharing.list.providers" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.sharing.list.public" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.sharing.list.service" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.sharing.list.legal" components={{ strong: strongComponent }} /></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.sharing.no_sell')}
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.cookies.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    <Trans
                        i18nKey="legal.privacy.sections.cookies.text"
                        components={{ 1: cookieLink }}
                    />
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.retention.title')}</h2>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li><Trans i18nKey="legal.privacy.sections.retention.list.account" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.retention.list.communication" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.retention.list.logs" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.retention.list.backup" components={{ strong: strongComponent }} /></li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.rights.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.rights.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.access" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.correction" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.deletion" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.portability" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.optout" components={{ strong: strongComponent }} /></li>
                    <li><Trans i18nKey="legal.privacy.sections.rights.list.restriction" components={{ strong: strongComponent }} /></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.rights.contact')}
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.security.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.security.text')}
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.children.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.children.text')}
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.changes.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.changes.text')}
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.privacy.sections.contact.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.privacy.sections.contact.text')}
                </p>
                <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">AtlasCaucasus.GE</strong></p>
                    <p>123 Rustaveli Avenue, Tbilisi, Georgia</p>
                    <p>Email: info@atlascaucasus.com</p>
                    <p>Phone: +995 555 123 456</p>
                </div>
            </section>
        </article>
    );
}
