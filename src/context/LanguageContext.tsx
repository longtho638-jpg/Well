import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'wellnexus_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>(() => {
        // Get from localStorage or default to 'vi'
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'vi') {
                return stored;
            }
        }
        return 'vi';
    });

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem(STORAGE_KEY, newLang);
    };

    useEffect(() => {
        // Update document lang attribute
        document.documentElement.lang = lang;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
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
