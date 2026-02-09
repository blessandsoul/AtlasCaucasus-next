'use client';

import { useTranslation } from 'react-i18next';
import React from 'react';

export default function TermsOfServiceClient() {
    const { t } = useTranslation();

    return (
        <article className="space-y-8">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('legal.terms.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('legal.terms.last_updated', { date: 'February 8, 2026' })}</p>
            </header>

            <p className="text-muted-foreground leading-relaxed">
                {t('legal.terms.intro')}
            </p>

            {/* 1. Description */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.description.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.description.text')}
                </p>
            </section>

            {/* 2. Registration */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.registration.title')}</h2>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.terms.sections.registration.list.age')}</li>
                    <li>{t('legal.terms.sections.registration.list.accuracy')}</li>
                    <li>{t('legal.terms.sections.registration.list.security')}</li>
                    <li>{t('legal.terms.sections.registration.list.multiple')}</li>
                    <li>{t('legal.terms.sections.registration.list.verify')}</li>
                </ul>
            </section>

            {/* 3. User Resp */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.user_resp.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('legal.terms.sections.user_resp.intro')}</p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.terms.sections.user_resp.list.truthful')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.fraud')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.unlawful')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.harass')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.circumvent')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.malicious')}</li>
                    <li>{t('legal.terms.sections.user_resp.list.compliance')}</li>
                </ul>
            </section>

            {/* 4. Provider Resp */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.provider_resp.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.provider_resp.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.terms.sections.provider_resp.list.accurate')}</li>
                    <li>{t('legal.terms.sections.provider_resp.list.timely')}</li>
                    <li>{t('legal.terms.sections.provider_resp.list.licenses')}</li>
                    <li>{t('legal.terms.sections.provider_resp.list.delivery')}</li>
                    <li>{t('legal.terms.sections.provider_resp.list.misrepresent')}</li>
                    <li>{t('legal.terms.sections.provider_resp.list.regulations')}</li>
                </ul>
            </section>

            {/* 5. Inquiry */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.inquiry.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.inquiry.text')}
                </p>
            </section>

            {/* 6. Content */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.content.title')}</h2>

                <div className="space-y-3">
                    <h3 className="font-medium">{t('legal.terms.sections.content.user.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {t('legal.terms.sections.content.user.text')}
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium">{t('legal.terms.sections.content.platform.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {t('legal.terms.sections.content.platform.text')}
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium">{t('legal.terms.sections.content.prohibited.title')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {t('legal.terms.sections.content.prohibited.text')}
                    </p>
                </div>
            </section>

            {/* 7. Reviews */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.reviews.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.reviews.text')}
                </p>
            </section>

            {/* 8. Liability */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.liability.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.liability.intro')}
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.terms.sections.liability.list.guarantee')}</li>
                    <li>{t('legal.terms.sections.liability.list.actions')}</li>
                    <li>{t('legal.terms.sections.liability.list.damages')}</li>
                    <li>{t('legal.terms.sections.liability.list.verification')}</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.liability.diligence')}
                </p>
            </section>

            {/* 9. Termination */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.termination.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">{t('legal.terms.sections.termination.intro')}</p>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>{t('legal.terms.sections.termination.list.violate')}</li>
                    <li>{t('legal.terms.sections.termination.list.false')}</li>
                    <li>{t('legal.terms.sections.termination.list.fraud')}</li>
                    <li>{t('legal.terms.sections.termination.list.complaints')}</li>
                    <li>{t('legal.terms.sections.termination.list.inactive')}</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.termination.deletion')}
                </p>
            </section>

            {/* 10. Dispute */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.dispute.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.dispute.text1')}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.dispute.text2')}
                </p>
            </section>

            {/* 11. Governing Law */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.law.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.law.text')}
                </p>
            </section>

            {/* 12. Changes */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.changes.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.changes.text')}
                </p>
            </section>

            {/* 13. Contact */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">{t('legal.terms.sections.contact.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                    {t('legal.terms.sections.contact.text')}
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
