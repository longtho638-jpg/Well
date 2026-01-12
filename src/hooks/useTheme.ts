import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const THEME_KEY = 'wellnexus-theme';

/**
 * useTheme - Theme management hook with system preference sync
 * 
 * Features:
 * - Light/Dark/System modes
 * - LocalStorage persistence
 * - System preference detection
 * - CSS class toggle on document root
 */
export function useTheme(): UseThemeReturn {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
    });

    // Get system preference
    const getSystemTheme = (): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Resolved theme (actual light/dark value)
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1a1a2e' : '#ffffff');
        }
    }, [resolvedTheme]);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // Force re-render when system preference changes
            setThemeState('system');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    };

    const toggleTheme = () => {
        const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    };
}

export default useTheme;
