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

// Cache for single breakpoint calculation
let cachedBreakpoint: Breakpoint | 'xs' | null = null;
let cachedWidth = 0;

function getBreakpointFromWidth(width: number): Breakpoint | 'xs' {
    // Simple cache: same width = same breakpoint
    if (width === cachedWidth && cachedBreakpoint) return cachedBreakpoint;

    let result: Breakpoint | 'xs' = 'xs';
    if (width >= BREAKPOINTS['2xl']) result = '2xl';
    else if (width >= BREAKPOINTS.xl) result = 'xl';
    else if (width >= BREAKPOINTS.lg) result = 'lg';
    else if (width >= BREAKPOINTS.md) result = 'md';
    else if (width >= BREAKPOINTS.sm) result = 'sm';

    cachedWidth = width;
    cachedBreakpoint = result;
    return result;
}

export function useCurrentBreakpoint(): Breakpoint | 'xs' {
    const [breakpoint, setBreakpoint] = useState<Breakpoint | 'xs'>(() =>
        typeof window !== 'undefined'
            ? getBreakpointFromWidth(window.innerWidth)
            : 'xs'
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Single resize handler with RAF throttling
        let rafId: number | null = null;
        const handleResize = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                setBreakpoint(getBreakpointFromWidth(window.innerWidth));
                rafId = null;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, []);

    return breakpoint;
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
