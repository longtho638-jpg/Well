/**
 * DOM Utilities
 * Phase 12: Time and Animation
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// ELEMENT QUERIES
// ============================================================================

export function $(selector: string): Element | null {
    return document.querySelector(selector);
}

export function $$(selector: string): Element[] {
    return Array.from(document.querySelectorAll(selector));
}

export function getById(id: string): HTMLElement | null {
    return document.getElementById(id);
}

// ============================================================================
// ELEMENT UTILITIES
// ============================================================================

export function hasClass(element: Element, className: string): boolean {
    return element.classList.contains(className);
}

export function addClass(element: Element, ...classNames: string[]): void {
    element.classList.add(...classNames);
}

export function removeClass(element: Element, ...classNames: string[]): void {
    element.classList.remove(...classNames);
}

export function toggleClass(element: Element, className: string): boolean {
    return element.classList.toggle(className);
}

// ============================================================================
// SCROLL UTILITIES
// ============================================================================

export function scrollToTop(smooth = true): void {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

export function scrollToElement(element: Element | string, offset = 0): void {
    const el = typeof element === 'string' ? $(element) : element;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY - offset;

    window.scrollTo({ top, behavior: 'smooth' });
}

export function isInViewport(element: Element, threshold = 0): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= window.innerHeight + threshold &&
        rect.right <= window.innerWidth + threshold
    );
}

// ============================================================================
// INTERSECTION OBSERVER HOOK
// ============================================================================

interface UseInViewOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
    const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
    const ref = useRef<T>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || (triggerOnce && hasTriggered)) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const inView = entry.isIntersecting;
                setIsInView(inView);
                if (inView && triggerOnce) {
                    setHasTriggered(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce, hasTriggered]);

    return { ref, isInView };
}

// ============================================================================
// CLICK OUTSIDE HOOK
// ============================================================================

export function useClickOutside<T extends HTMLElement>(
    callback: () => void
): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);

    return ref;
}

// ============================================================================
// ELEMENT SIZE HOOK
// ============================================================================

interface ElementSize {
    width: number;
    height: number;
}

export function useElementSize<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    ElementSize
] {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            setSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, size];
}

// ============================================================================
// HOVER HOOK
// ============================================================================

export function useHover<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    boolean
] {
    const ref = useRef<T>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleEnter = () => setIsHovered(true);
        const handleLeave = () => setIsHovered(false);

        element.addEventListener('mouseenter', handleEnter);
        element.addEventListener('mouseleave', handleLeave);

        return () => {
            element.removeEventListener('mouseenter', handleEnter);
            element.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    return [ref, isHovered];
}

// ============================================================================
// FOCUS HOOK
// ============================================================================

export function useFocus<T extends HTMLElement>(): [
    React.RefObject<T | null>,
    boolean,
    { focus: () => void; blur: () => void }
] {
    const ref = useRef<T>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);

        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);

        return () => {
            element.removeEventListener('focus', handleFocus);
            element.removeEventListener('blur', handleBlur);
        };
    }, []);

    const focus = useCallback(() => ref.current?.focus(), []);
    const blur = useCallback(() => ref.current?.blur(), []);

    return [ref, isFocused, { focus, blur }];
}
