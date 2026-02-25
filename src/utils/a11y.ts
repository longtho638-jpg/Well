/**
 * Accessibility Utilities
 * Phase 6: Security + i18n + A11y
 */

import React, { useEffect, useCallback, useRef } from 'react';

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}

/**
 * Skip to main content link
 */
export function useSkipLink() {
    const skipToMain = useCallback(() => {
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main instanceof HTMLElement) {
            main.tabIndex = -1;
            main.focus();
        }
    }, []);

    return skipToMain;
}

// ============================================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================================

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

/**
 * Hook for announcements
 */
export function useAnnounce() {
    return useCallback((message: string, priority?: 'polite' | 'assertive') => {
        announce(message, priority);
    }, []);
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
    const mediaQuery = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const getMatches = () => mediaQuery?.matches ?? false;

    const ref = useRef(getMatches());

    useEffect(() => {
        if (!mediaQuery) return;

        const handler = () => {
            ref.current = mediaQuery.matches;
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [mediaQuery]);

    return ref.current;
}

// ============================================================================
// ARIA UTILITIES
// ============================================================================

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
    return `${prefix}-${++idCounter}`;
}

/**
 * Common ARIA props for interactive elements
 */
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

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Hook for arrow key navigation in lists
 */
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
