import { vi, type TranslationKeys } from '@/locales/vi';

/**
 * Simple i18n hook for WellNexus
 * Provides translation function with nested key support and variable interpolation
 *
 * @example
 * const t = useTranslation();
 * t('dashboard.welcome', { name: 'John' }) // "Chào mừng trở lại, John!"
 * t('common.loading') // "Đang tải..."
 */

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<TranslationKeys>;

type Variables = Record<string, string | number>;

/**
 * Get nested value from object using dot notation
 * @example getNestedValue(vi, 'dashboard.welcome') // Returns the translation string
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation key not found: ${path}`);
      return path; // Return key as fallback
    }
  }

  return typeof result === 'string' ? result : path;
}

/**
 * Replace variables in translation string
 * Supports {variableName} syntax
 * @example interpolate("Hello, {name}!", { name: "John" }) // "Hello, John!"
 */
function interpolate(text: string, variables?: Variables): string {
  if (!variables) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Translation hook
 * @returns Translation function
 */
export function useTranslation() {
  /**
   * Translate function
   * @param key - Translation key using dot notation (e.g., 'dashboard.welcome')
   * @param variables - Optional variables for interpolation
   * @returns Translated string with variables replaced
   */
  const t = (key: TranslationKey, variables?: Variables): string => {
    const translation = getNestedValue(vi, key);
    return interpolate(translation, variables);
  };

  return t;
}

// Export standalone function for use outside React components
export function translate(key: TranslationKey, variables?: Variables): string {
  const translation = getNestedValue(vi, key);
  return interpolate(translation, variables);
}

/**
 * Type-safe translation object for direct access
 * Use this when you need the entire translation object
 */
export const translations = vi;
