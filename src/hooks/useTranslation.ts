import { useTranslation as useI18nTranslation } from 'react-i18next';
import { vi } from '@/locales/vi';
import i18next from 'i18next';

// Define a simpler type for t that accepts any arguments and returns a string
type SimpleT = (key: string, ...args: any[]) => string;

/**
 * Enterprise Translation Hook (i18next Wrapper)
 * Provides a standard interface for translations across the platform.
 */
export function useTranslation() {
  // @ts-ignore - Bypass infinite type instantiation
  const { t: i18nT, i18n } = useI18nTranslation() as any;

  // Normalize language code
  const lang = (i18n.language === 'en' || i18n.language?.startsWith('en')) ? 'en' : 'vi';

  const setLang = (newLang: string) => {
    i18n.changeLanguage(newLang);
  };

  // Explicitly cast t to a simple function signature to bypass strict i18next type checks
  const t: SimpleT = (key: string, ...args: any[]): string => {
    return i18nT(key, ...args) as string;
  };

  return { t, lang, setLang, i18n };
}

/**
 * Legacy standalone translate function
 */
export function translate(key: string, variables?: Record<string, any>): string {
  // @ts-ignore
  return i18next.t(key, variables) as string;
}

/**
 * Legacy translations object access
 */
export const translations = vi;
export type TranslationKey = string; // Placeholder type