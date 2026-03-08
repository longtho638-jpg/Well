import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'wellnexus-theme';
const META_THEME_COLORS: Record<Theme, string> = {
  dark: '#0F172A',
  light: '#F3F4F6',
};

// SSR-safe theme initialization
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme;
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Lazy init để tránh re-render khi mount
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply theme - dùng useMemo cho value để tránh re-render
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    const metaThemeColor = document.querySelector('#meta-theme-color');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', META_THEME_COLORS[theme]);
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // System preference - chỉ chạy 1 lần
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme) return; // User đã chọn theme

    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // useMemo cho context value để tránh re-render children
  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setThemeState(prev => prev === 'light' ? 'dark' : 'light'),
    setTheme: setThemeState,
    isDark: theme === 'dark',
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
