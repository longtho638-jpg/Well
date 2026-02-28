/**
 * Vibe i18n SDK — Provider-Agnostic Internationalization Types
 *
 * Reusable locale types and config for any RaaS project.
 * Supports vi/en with extensible locale registry.
 */

// ─── Locale ─────────────────────────────────────────────────────

export type Locale = 'vi' | 'en';

export type TextDirection = 'ltr' | 'rtl';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  direction: TextDirection;
  dateFormat: string;
  currencyCode: string;
  currencySymbol: string;
}

/** Default locale registry — Vietnamese + English */
export const LOCALES: Record<Locale, LocaleConfig> = {
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    currencyCode: 'VND',
    currencySymbol: '₫',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    currencyCode: 'USD',
    currencySymbol: '$',
  },
};

// ─── Pluralization ──────────────────────────────────────────────

export interface PluralForms {
  one: string;
  other: string;
  zero?: string;
}
