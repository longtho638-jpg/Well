import { useTranslation as useI18nTranslation } from 'react-i18next';
import { vi } from '@/locales/vi';
import i18next, { TOptions } from 'i18next';

// Define a translation function type using i18next's TOptions
type TranslationFunction = (
  key: string,
  options?: TOptions | string
) => string;

/**
 * Enterprise Translation Hook (i18next Wrapper)
 * Provides a standard interface for translations across the platform.
 */
export function useTranslation() {
  const { t: i18nT, i18n } = useI18nTranslation();

  // Normalize language code
  const lang = (i18n.language === 'en' || i18n.language?.startsWith('en')) ? 'en' : 'vi';

  const setLang = (newLang: string) => {
    i18n.changeLanguage(newLang);
  };

  // Explicitly cast t to a simple function signature to bypass strict i18next type checks
  const t: TranslationFunction = (key: string, options?: TOptions | string): string => {
    // @ts-expect-error - Dynamic string keys intentionally bypass i18next's strict key types
    return i18nT(key, options as TOptions) as string;
  };

  return { t, lang, setLang, i18n };
}

/**
 * Legacy standalone translate function
 */
export function translate(key: string, variables?: Record<string, unknown>): string {
  // @ts-expect-error - Dynamic string key bypasses i18next strict key constraint
  return i18next.t(key, variables) as string;
}

/**
 * Legacy translations object access
 */
export const translations = vi;
export type TranslationKey = string; // Placeholder type