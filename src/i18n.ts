import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './locales/en';
import { vi } from './locales/vi';

// Enterprise Standard i18n Configuration
i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true, // Enable debug mode for development
    fallbackLng: 'vi', // Default fallback language
    load: 'languageOnly', // Load 'en' instead of 'en-US'
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    supportedLngs: ['en', 'vi'],
    nonExplicitSupportedLngs: true, // Allow en-US to match en
    resources: {
      en: {
        translation: en
      },
      'en-US': {
        translation: en
      },
      vi: {
        translation: vi
      }
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'wellnexus_language', // Match existing key
    }
  });

export default i18n;
