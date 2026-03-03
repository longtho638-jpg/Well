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

  const t: TranslationFunction = (key: string, options?: TOptions | string): string => {
    return (i18nT as TranslationFunction)(key, options);
  };

  return { t, lang, setLang, i18n };
}

/**
 * Legacy standalone translate function
 */
export function translate(key: string, variables?: Record<string, unknown>): string {
  return (i18next.t as TranslationFunction)(key, variables as TOptions);
}

/**
 * Legacy translations object access
 */
export const translations = vi;
export type TranslationKey = string; // Placeholder type