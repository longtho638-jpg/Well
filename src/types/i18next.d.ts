import 'i18next';
import { en } from '../locales/en';

// Helper type to extract all nested keys from a locale object
type NestedKeys<T, Prefix = ''> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? NestedKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
    }[keyof T]
  : never;

// Get all keys from the en object
type AllTranslationKeys = NestedKeys<typeof en>;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
      // Allow commonly used namespaces for backward compatibility
      analytics: typeof en['analytics'];
      raas: typeof en['raas'];
      billing: typeof en['billing'];
      auditlog: typeof en['auditlog'];
      realtime: typeof en['realtime'];
      alerts: typeof en['alerts'];
    };
  }

  // Allow any string key when using t() function
  interface TFunction {
    (key: string | string[], options?: Record<string, unknown>): string;
    (key: string | string[], defaultValue: string, options?: Record<string, unknown>): string;
  }
}
