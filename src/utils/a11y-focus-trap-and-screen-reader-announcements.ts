/**
 * Accessibility focus-trap hook and screen-reader live-region announcement utilities.
 * Extracted from utils/a11y.ts to keep it under 200 LOC.
 */

import { useEffect, useCallback, useRef } from 'react';

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
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
            } else {
                if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}

export function useSkipLink() {
    return useCallback(() => {
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main instanceof HTMLElement) { main.tabIndex = -1; main.focus(); }
    }, []);
}

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

export function useAnnounce() {
    return useCallback((message: string, priority?: 'polite' | 'assertive') => {
        announce(message, priority);
    }, []);
}
