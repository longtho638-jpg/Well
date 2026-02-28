/**
 * i18n Type Definitions & Constants
 */

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
