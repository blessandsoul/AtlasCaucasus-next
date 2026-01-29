'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files directly to bundle them
import enTranslation from '../locales/en/translation.json';
import kaTranslation from '../locales/ka/translation.json';
import ruTranslation from '../locales/ru/translation.json';

const resources = {
    en: {
        translation: enTranslation,
    },
    ka: {
        translation: kaTranslation,
    },
    ru: {
        translation: ruTranslation,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: 'ka', // Default to Georgian
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false,
        },

        supportedLngs: ['en', 'ka', 'ru'],

        // Remove backend configuration as we use resources directly
        ns: ['translation'],
        defaultNS: 'translation',

        react: {
            useSuspense: false
        }
    });

export default i18n;
