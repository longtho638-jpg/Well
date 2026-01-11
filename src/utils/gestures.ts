/**
 * Gesture Utilities
 * Phase 16: Keyboard and Gestures
 */

import { useRef, useCallback, TouchEvent as ReactTouchEvent } from 'react';

// ============================================================================
// SWIPE DETECTION
// ============================================================================

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

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

export function useSwipe(
    handlers: SwipeHandlers,
    options: UseSwipeOptions = {}
) {
    const { threshold = 50, preventScroll = false } = options;
    const startX = useRef(0);
    const startY = useRef(0);

    const onTouchStart = useCallback((e: ReactTouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
    }, []);

    const onTouchEnd = useCallback((e: ReactTouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const deltaX = endX - startX.current;
        const deltaY = endY - startY.current;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (Math.max(absX, absY) < threshold) return;

        if (absX > absY) {
            // Horizontal swipe
            if (deltaX > 0) {
                handlers.onSwipeRight?.();
            } else {
                handlers.onSwipeLeft?.();
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                handlers.onSwipeDown?.();
            } else {
                handlers.onSwipeUp?.();
            }
        }
    }, [handlers, threshold]);

    const onTouchMove = useCallback((e: ReactTouchEvent) => {
        if (preventScroll) {
            e.preventDefault();
        }
    }, [preventScroll]);

    return {
        onTouchStart,
        onTouchEnd,
        onTouchMove,
    };
}

// ============================================================================
// LONG PRESS
// ============================================================================

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
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleClick = useCallback(() => {
        if (!isLongPress.current && onClick) {
            onClick();
        }
    }, [onClick]);

    return {
        onMouseDown: start,
        onMouseUp: cancel,
        onMouseLeave: cancel,
        onTouchStart: start,
        onTouchEnd: cancel,
        onClick: handleClick,
    };
}

// ============================================================================
// DOUBLE TAP
// ============================================================================

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
            // Double tap
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            onDoubleTap();
        } else {
            // Potential single tap - wait to confirm
            timerRef.current = setTimeout(() => {
                onSingleTap?.();
            }, delay);
        }

        lastTap.current = now;
    }, [delay, onDoubleTap, onSingleTap]);

    return { onClick: handleTap };
}

// ============================================================================
// DRAG AND DROP
// ============================================================================

interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
}

export function useDrag(onDragEnd?: (state: DragState) => void) {
    const stateRef = useRef<DragState>({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
    });

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        stateRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            deltaX: 0,
            deltaY: 0,
        };
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!stateRef.current.isDragging) return;

        stateRef.current = {
            ...stateRef.current,
            currentX: e.clientX,
            currentY: e.clientY,
            deltaX: e.clientX - stateRef.current.startX,
            deltaY: e.clientY - stateRef.current.startY,
        };
    }, []);

    const onMouseUp = useCallback(() => {
        if (stateRef.current.isDragging) {
            stateRef.current.isDragging = false;
            onDragEnd?.(stateRef.current);
        }
    }, [onDragEnd]);

    return {
        onMouseDown,
        onMouseMove,
        onMouseUp,
        getState: () => stateRef.current,
    };
}
