import { useTranslation as useI18nTranslation } from 'react-i18next';
import { vi, type TranslationKeys } from '@/locales/vi';
import i18next from 'i18next';

/**
 * Multi-language i18n types for WellNexus
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeys>;

/**
 * Enterprise Translation Hook (i18next Wrapper)
 * Provides a standard interface for translations across the platform.
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  // Normalize language code
  const lang = (i18n.language === 'en' || i18n.language?.startsWith('en')) ? 'en' : 'vi';

  const setLang = (newLang: string) => {
    i18n.changeLanguage(newLang);
  };

  // Explicitly cast t to a simple function signature to bypass strict i18next type checks
  const simpleT = (key: string, options?: any): string => {
    return t(key, options) as string;
  };

  return { t: simpleT, lang, setLang, i18n };
}

/**
 * Legacy standalone translate function
 */
export function translate(key: string, variables?: Record<string, any>): string {
  return i18next.t(key, variables) as string;
}

/**
 * Legacy translations object access
 */
export const translations = vi;
