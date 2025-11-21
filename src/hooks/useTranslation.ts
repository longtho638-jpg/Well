/**
 * useTranslation Hook
 *
 * Simple hook to access translations in components
 */

import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { t, locale, setLocale } = useLanguage();

  /**
   * Helper function to interpolate variables in translation strings
   * Example: t.sidebar.dayProgress with {current: 3, total: 30} => "Ngày 3/30"
   */
  const interpolate = (text: string, vars: Record<string, string | number>) => {
    return Object.entries(vars).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, text);
  };

  return {
    t,
    locale,
    setLocale,
    interpolate,
  };
};
