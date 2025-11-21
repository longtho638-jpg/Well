/**
 * Language Context
 *
 * Provides language switching capabilities across the application
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { locales, Locale, Translations } from '../locales';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLocale = 'vi', // Default to Vietnamese
}) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const value: LanguageContextType = {
    locale,
    setLocale,
    t: locales[locale],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
