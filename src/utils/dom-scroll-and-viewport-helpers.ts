/**
 * DOM scroll helpers and viewport intersection utilities.
 * Extracted from utils/dom.ts to keep it under 200 LOC.
 */

import { useEffect, useRef, useState } from 'react';
import { $ } from './dom-element-query-and-class-helpers';

export function scrollToTop(smooth = true): void {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

export function scrollToElement(element: Element | string, offset = 0): void {
    const el = typeof element === 'string' ? $(element) : element;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    window.scrollTo({ top: rect.top + window.scrollY - offset, behavior: 'smooth' });
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
