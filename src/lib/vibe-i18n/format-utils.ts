/**
 * Vibe i18n SDK — Format Utilities
 *
 * High-level formatting functions for numbers, currency, dates, and plurals.
 * Uses memoized Intl formatters for performance.
 */

import type { Locale, PluralForms } from './types';
import { LOCALES } from './types';
import {
  getNumberFormatter,
  getCurrencyFormatter,
  getPercentFormatter,
  getDateFormatter,
  getDateTimeFormatter,
  getRelativeTimeFormatter,
} from './memoized-intl-formatters';

// ─── Number / Currency / Percent ────────────────────────────────

export function formatNumber(value: number, locale: Locale = 'vi'): string {
  return getNumberFormatter(locale).format(value);
}

export function formatCurrency(value: number, locale: Locale = 'vi'): string {
  return getCurrencyFormatter(locale).format(value);
}

export function formatPercent(value: number, locale: Locale = 'vi'): string {
  return getPercentFormatter(locale).format(value / 100);
}

// ─── Date / Time ────────────────────────────────────────────────

function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

export function formatDate(date: Date | string, locale: Locale = 'vi'): string {
  return getDateFormatter(locale).format(toDate(date));
}

export function formatDateTime(date: Date | string, locale: Locale = 'vi'): string {
  return getDateTimeFormatter(locale).format(toDate(date));
}

export function formatRelativeTime(date: Date | string, locale: Locale = 'vi'): string {
  const d = toDate(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = getRelativeTimeFormatter(locale);
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

export function formatTime(date: Date | string, locale: Locale = 'vi'): string {
  const localeStr = locale === 'vi' ? 'vi-VN' : 'en-US';
  return toDate(date).toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date | string, locale: Locale = 'vi'): string {
  const localeStr = locale === 'vi' ? 'vi-VN' : 'en-US';
  return toDate(date).toLocaleDateString(localeStr, { month: 'short', day: 'numeric' });
}

// ─── Pluralization ──────────────────────────────────────────────

export function pluralize(count: number, forms: PluralForms, locale: Locale = 'vi'): string {
  // Vietnamese doesn't have plural forms
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

// ─── Locale Detection ───────────────────────────────────────────

export function detectLocale(): Locale {
  const stored = localStorage.getItem('locale');
  if (stored === 'vi' || stored === 'en') return stored;

  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'vi') return 'vi';
  if (browserLang === 'en') return 'en';

  return 'vi';
}

export function setLocale(locale: Locale): void {
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALES[locale].direction;
}
