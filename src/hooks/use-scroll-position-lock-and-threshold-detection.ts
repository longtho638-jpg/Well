/**
 * Scroll Position, Lock and Threshold Detection Hooks — tracks scroll X/Y position, detects scroll past threshold, and locks body overflow
 */

import { useState, useEffect } from 'react';

interface ScrollPosition {
    x: number;
    y: number;
}

export function useScrollPosition(): ScrollPosition {
    const [position, setPosition] = useState<ScrollPosition>(() => ({
        x: typeof window !== 'undefined' ? window.scrollX : 0,
        y: typeof window !== 'undefined' ? window.scrollY : 0,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleScroll = () => {
            setPosition({ x: window.scrollX, y: window.scrollY });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return position;
}

/**
 * Returns true when scroll Y exceeds the given threshold (default 0)
 */
export function useIsScrolled(threshold = 0): boolean {
    const { y } = useScrollPosition();
    return y > threshold;
}

/**
 * Locks document body scroll when `lock` is true, restores on cleanup
 */
export function useScrollLock(lock: boolean): void {
    useEffect(() => {
        if (!lock) return;

        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [lock]);
}
