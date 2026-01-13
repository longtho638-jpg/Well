import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: any; // Disable strict type checking for resources to avoid excessively deep recursion
  }
}
