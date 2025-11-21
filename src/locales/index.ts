/**
 * Locales Index
 *
 * Central export for all language translations
 */

import { vi } from './vi';
import { en } from './en';

export const locales = {
  vi,
  en,
} as const;

export type Locale = keyof typeof locales;
export type Translations = typeof vi;

export { vi, en };
