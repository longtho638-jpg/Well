/**
 * i18n Enhancement Types
 * Phase 6: Extended internationalization support
 */

import { i18nService } from '../services/i18nService';

// ============================================================================
// LOCALE TYPES
// ============================================================================

export type Locale = 'vi' | 'en';

export interface LocaleConfig {
    code: Locale;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    dateFormat: string;
    currencyCode: string;
    currencySymbol: string;
}

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

export function formatNumber(value: number, locale: Locale = 'vi'): string {
    return i18nService.getNumberFormatter(locale).format(value);
}

export function formatCurrency(value: number, locale: Locale = 'vi'): string {
    return i18nService.getCurrencyFormatter(locale).format(value);
}

export function formatPercent(value: number, locale: Locale = 'vi'): string {
    return i18nService.getPercentFormatter(locale).format(value / 100);
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function formatDate(date: Date | string, locale: Locale = 'vi'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return i18nService.getDateFormatter(locale).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale = 'vi'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return i18nService.getDateTimeFormatter(locale).format(d);
}

export function formatRelativeTime(date: Date | string, locale: Locale = 'vi'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return i18nService.formatRelativeTime(d, locale);
}

// ============================================================================
// PLURALIZATION
// ============================================================================

type PluralForms = {
    one: string;
    other: string;
    zero?: string;
};

export function pluralize(count: number, forms: PluralForms, locale: Locale = 'vi'): string {
    // Vietnamese doesn't have plural forms, English does
    if (locale === 'vi') {
        return forms.other.replace('{count}', String(count));
    }

    if (count === 0 && forms.zero) {
        return forms.zero.replace('{count}', String(count));
    }
    if (count === 1) {
        return forms.one.replace('{count}', String(count));
    }
    return forms.other.replace('{count}', String(count));
}

// ============================================================================
// LOCALE DETECTION
// ============================================================================

export function detectLocale(): Locale {
    // Check localStorage preference
    const stored = localStorage.getItem('locale');
    if (stored === 'vi' || stored === 'en') return stored;

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'vi') return 'vi';
    if (browserLang === 'en') return 'en';

    // Default to Vietnamese
    return 'vi';
}

export function setLocale(locale: Locale): void {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALES[locale].direction;
}
