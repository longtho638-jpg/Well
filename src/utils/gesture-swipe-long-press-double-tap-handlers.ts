/**
 * Touch gesture handlers: swipe, long-press, double-tap detection hooks.
 * Extracted from utils/gestures.ts to keep it under 200 LOC.
 */

import { useRef, useCallback, TouchEvent as ReactTouchEvent } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface UseSwipeOptions {
    threshold?: number;
    preventScroll?: boolean;
}

export function useSwipe(handlers: SwipeHandlers, options: UseSwipeOptions = {}) {
    const { threshold = 50, preventScroll = false } = options;
    const startX = useRef(0);
    const startY = useRef(0);

    const onTouchStart = useCallback((e: ReactTouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
    }, []);

    const onTouchEnd = useCallback((e: ReactTouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - startX.current;
        const deltaY = e.changedTouches[0].clientY - startY.current;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (Math.max(absX, absY) < threshold) return;
        if (absX > absY) {
            deltaX > 0 ? handlers.onSwipeRight?.() : handlers.onSwipeLeft?.();
        } else {
            deltaY > 0 ? handlers.onSwipeDown?.() : handlers.onSwipeUp?.();
        }
    }, [handlers, threshold]);

    const onTouchMove = useCallback((e: ReactTouchEvent) => {
        if (preventScroll) e.preventDefault();
    }, [preventScroll]);

    return { onTouchStart, onTouchEnd, onTouchMove };
}

interface UseLongPressOptions {
    delay?: number;
    onLongPress: () => void;
    onClick?: () => void;
}

export function useLongPress(options: UseLongPressOptions) {
    const { delay = 500, onLongPress, onClick } = options;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const start = useCallback(() => {
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            onLongPress();
        }, delay);
    }, [delay, onLongPress]);

    const cancel = useCallback(() => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }, []);

    const handleClick = useCallback(() => {
        if (!isLongPress.current && onClick) onClick();
    }, [onClick]);

    return { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel, onTouchStart: start, onTouchEnd: cancel, onClick: handleClick };
}

interface UseDoubleTapOptions {
    delay?: number;
    onDoubleTap: () => void;
    onSingleTap?: () => void;
}

export function useDoubleTap(options: UseDoubleTapOptions) {
    const { delay = 300, onDoubleTap, onSingleTap } = options;
    const lastTap = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTap = useCallback(() => {
        const now = Date.now();
        const timeDiff = now - lastTap.current;
        if (timeDiff < delay && timeDiff > 0) {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            onDoubleTap();
        } else {
            timerRef.current = setTimeout(() => { onSingleTap?.(); }, delay);
        }
        lastTap.current = now;
    }, [delay, onDoubleTap, onSingleTap]);

    return { onClick: handleTap };
}
