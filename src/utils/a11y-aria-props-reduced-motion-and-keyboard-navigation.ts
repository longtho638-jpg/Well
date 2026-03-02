/**
 * Accessibility ARIA helpers, reduced-motion detection, and keyboard arrow-navigation hook.
 * Extracted from utils/a11y.ts to keep it under 200 LOC.
 */

import React, { useEffect, useCallback, useRef } from 'react';

export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
    const mediaQuery = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const getMatches = () => mediaQuery?.matches ?? false;
    const ref = useRef(getMatches());

    useEffect(() => {
        if (!mediaQuery) return;
        const handler = () => { ref.current = mediaQuery.matches; };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [mediaQuery]);

    return ref.current;
}

let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
    return `${prefix}-${++idCounter}`;
}

export function getAriaProps(options: {
    label: string;
    description?: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
}): Record<string, string | boolean | undefined> {
    return {
        'aria-label': options.label,
        'aria-describedby': options.description,
        'aria-expanded': options.expanded,
        'aria-pressed': options.pressed,
        'aria-disabled': options.disabled,
    };
}

export function useArrowNavigation<T extends HTMLElement>(
    items: number,
    onSelect?: (index: number) => void
) {
    const currentIndex = useRef(0);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<T>) => {
        let newIndex = currentIndex.current;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                newIndex = Math.min(currentIndex.current + 1, items - 1);
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = Math.max(currentIndex.current - 1, 0);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = items - 1;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                onSelect?.(currentIndex.current);
                return;
            default:
                return;
        }

        if (newIndex !== currentIndex.current) {
            currentIndex.current = newIndex;
            onSelect?.(newIndex);
        }
    }, [items, onSelect]);

    return { handleKeyDown, currentIndex: currentIndex.current };
}
