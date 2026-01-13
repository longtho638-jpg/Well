import { vi, type TranslationKeys } from '@/locales/vi';
import { en } from '@/locales/en';
import { useLanguage } from '@/context/LanguageContext';
import { uiLogger } from '@/utils/logger';

/**
 * Multi-language i18n hook for WellNexus
 * Supports Vietnamese (vi) and English (en) with localStorage persistence
 *
 * @example
 * const { t, lang, setLang } = useTranslation();
 * t('dashboard.welcome', { name: 'John' })
 * setLang('en') // Switch to English
 */

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeys>;

type Variables = Record<string, string | number>;

const locales = { vi, en };

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      uiLogger.warn(`Translation key not found: ${path}`);
      return path; // Return key as fallback
    }
  }

  return typeof result === 'string' ? result : path;
}

/**
 * Replace variables in translation string
 */
function interpolate(text: string, variables?: Variables): string {
  if (!variables) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Translation hook with language switching
 */
export function useTranslation() {
  const { lang, setLang } = useLanguage();
  const translations = locales[lang];

  const t = (key: TranslationKey, variables?: Variables): string => {
    const translation = getNestedValue(translations, key);
    return interpolate(translation, variables);
  };

  return { t, lang, setLang };
}

/**
 * Standalone translate function (uses default vi)
 */
export function translate(key: TranslationKey, variables?: Variables): string {
  const translation = getNestedValue(vi, key);
  return interpolate(translation, variables);
}

/**
 * Type-safe translation object for direct access
 */
export const translations = vi;

