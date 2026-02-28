/**
 * i18n Service
 * High-performance internationalization engine with memoized formatters.
 */

import { Locale, LOCALES } from '../types/i18n';

// Cache for Intl formatters to avoid expensive re-initialization
const formatters = {
    number: new Map<string, Intl.NumberFormat>(),
    currency: new Map<string, Intl.NumberFormat>(),
    percent: new Map<string, Intl.NumberFormat>(),
    date: new Map<string, Intl.DateTimeFormat>(),
    dateTime: new Map<string, Intl.DateTimeFormat>(),
    relativeTime: new Map<string, Intl.RelativeTimeFormat>(),
};

export const i18nService = {
    /**
     * Get or create a memoized number formatter
     */
    getNumberFormatter(locale: Locale): Intl.NumberFormat {
        const key = locale;
        let formatter = formatters.number.get(key);
        if (!formatter) {
            formatter = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US');
            formatters.number.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Get or create a memoized currency formatter
     */
    getCurrencyFormatter(locale: Locale): Intl.NumberFormat {
        const key = locale;
        let formatter = formatters.currency.get(key);
        if (!formatter) {
            const config = LOCALES[locale];
            formatter = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: config.currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            });
            formatters.currency.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Get or create a memoized percent formatter
     */
    getPercentFormatter(locale: Locale): Intl.NumberFormat {
        const key = locale;
        let formatter = formatters.percent.get(key);
        if (!formatter) {
            formatter = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'percent',
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
            });
            formatters.percent.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Get or create a memoized short date formatter
     */
    getDateFormatter(locale: Locale): Intl.DateTimeFormat {
        const key = locale;
        let formatter = formatters.date.get(key);
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
            formatters.date.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Get or create a memoized full datetime formatter
     */
    getDateTimeFormatter(locale: Locale): Intl.DateTimeFormat {
        const key = locale;
        let formatter = formatters.dateTime.get(key);
        if (!formatter) {
            formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            formatters.dateTime.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Get or create a memoized relative time formatter
     */
    getRelativeTimeFormatter(locale: Locale): Intl.RelativeTimeFormat {
        const key = locale;
        let formatter = formatters.relativeTime.get(key);
        if (!formatter) {
            formatter = new Intl.RelativeTimeFormat(locale === 'vi' ? 'vi' : 'en', { numeric: 'auto' });
            formatters.relativeTime.set(key, formatter);
        }
        return formatter;
    },

    /**
     * Format currency using memoized formatter
     */
    formatCurrency(value: number, locale: Locale): string {
        return this.getCurrencyFormatter(locale).format(value);
    },

    /**
     * Format relative time using memoized formatter
     */
    formatRelativeTime(date: Date, locale: Locale): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const rtf = this.getRelativeTimeFormatter(locale);

        if (days > 0) return rtf.format(-days, 'day');
        if (hours > 0) return rtf.format(-hours, 'hour');
        if (minutes > 0) return rtf.format(-minutes, 'minute');
        return rtf.format(-seconds, 'second');
    }
};
