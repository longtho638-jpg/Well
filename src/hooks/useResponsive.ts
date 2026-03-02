/**
 * Responsive Utilities — breakpoint constants, media query hooks, window size, and responsive value selector
 * Phase 10: Forms and Responsive
 */

import { useState, useEffect } from 'react';

export { useScrollPosition, useIsScrolled, useScrollLock } from './use-scroll-position-lock-and-threshold-detection';

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ============================================================================
// MEDIA QUERY HOOKS
// ============================================================================

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia(query);
        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

export function useCurrentBreakpoint(): Breakpoint | 'xs' {
    const isSm = useBreakpoint('sm');
    const isMd = useBreakpoint('md');
    const isLg = useBreakpoint('lg');
    const isXl = useBreakpoint('xl');
    const is2xl = useBreakpoint('2xl');

    if (is2xl) return '2xl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
}

export function useIsMobile(): boolean { return !useBreakpoint('md'); }
export function useIsTablet(): boolean {
    const isMd = useBreakpoint('md');
    const isLg = useBreakpoint('lg');
    return isMd && !isLg;
}
export function useIsDesktop(): boolean { return useBreakpoint('lg'); }

// ============================================================================
// WINDOW SIZE HOOK
// ============================================================================

interface WindowSize { width: number; height: number; }

export function useWindowSize(): WindowSize {
    const [size, setSize] = useState<WindowSize>(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
}

// ============================================================================
// RESPONSIVE VALUE
// ============================================================================

type ResponsiveValue<T> = { base: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T; };

export function useResponsiveValue<T>(values: ResponsiveValue<T>): T {
    const breakpoint = useCurrentBreakpoint();
    const breakpoints: (Breakpoint | 'xs')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpoints.indexOf(breakpoint);

    for (let i = currentIndex; i < breakpoints.length; i++) {
        const bp = breakpoints[i];
        if (bp === 'xs') return values.base;
        const val = values[bp];
        if (val !== undefined) return val;
    }

    return values.base;
}
