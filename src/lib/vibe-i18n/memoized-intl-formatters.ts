/**
 * Vibe i18n SDK — Memoized Intl Formatters
 *
 * High-performance Intl.* formatter cache.
 * Avoids expensive re-initialization of Intl objects per render.
 * Provider-agnostic — works with any locale system.
 */

import type { Locale } from './types';
import { LOCALES } from './types';

// ─── Formatter Cache ────────────────────────────────────────────

const cache = {
  number: new Map<string, Intl.NumberFormat>(),
  currency: new Map<string, Intl.NumberFormat>(),
  percent: new Map<string, Intl.NumberFormat>(),
  date: new Map<string, Intl.DateTimeFormat>(),
  dateTime: new Map<string, Intl.DateTimeFormat>(),
  relativeTime: new Map<string, Intl.RelativeTimeFormat>(),
};

function toIntlLocale(locale: Locale): string {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

// ─── Formatter Getters ──────────────────────────────────────────

export function getNumberFormatter(locale: Locale): Intl.NumberFormat {
  let f = cache.number.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(toIntlLocale(locale));
    cache.number.set(locale, f);
  }
  return f;
}

export function getCurrencyFormatter(locale: Locale): Intl.NumberFormat {
  let f = cache.currency.get(locale);
  if (!f) {
    const config = LOCALES[locale];
    f = new Intl.NumberFormat(toIntlLocale(locale), {
      style: 'currency',
      currency: config.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    cache.currency.set(locale, f);
  }
  return f;
}

export function getPercentFormatter(locale: Locale): Intl.NumberFormat {
  let f = cache.percent.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(toIntlLocale(locale), {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    cache.percent.set(locale, f);
  }
  return f;
}

export function getDateFormatter(locale: Locale): Intl.DateTimeFormat {
  let f = cache.date.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(toIntlLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    cache.date.set(locale, f);
  }
  return f;
}

export function getDateTimeFormatter(locale: Locale): Intl.DateTimeFormat {
  let f = cache.dateTime.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(toIntlLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    cache.dateTime.set(locale, f);
  }
  return f;
}

export function getRelativeTimeFormatter(locale: Locale): Intl.RelativeTimeFormat {
  let f = cache.relativeTime.get(locale);
  if (!f) {
    f = new Intl.RelativeTimeFormat(locale === 'vi' ? 'vi' : 'en', { numeric: 'auto' });
    cache.relativeTime.set(locale, f);
  }
  return f;
}
