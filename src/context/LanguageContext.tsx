import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from '@/hooks';

type Language = 'vi' | 'en';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation();

    const setLang = (newLang: Language) => {
        i18n.changeLanguage(newLang);
    };

    // Ensure lang is strictly 'vi' or 'en'
    const currentLang = (i18n.language === 'en' || i18n.language?.startsWith('en')) ? 'en' : 'vi';

    useEffect(() => {
        // Update document lang attribute
        document.documentElement.lang = currentLang;
    }, [currentLang]);

    return (
        <LanguageContext.Provider value={{ lang: currentLang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}