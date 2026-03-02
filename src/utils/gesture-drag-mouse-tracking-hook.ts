/**
 * Mouse drag tracking hook with start/move/end state management.
 * Extracted from utils/gestures.ts to keep it under 200 LOC.
 */

import React, { useRef, useCallback } from 'react';

export interface DragState {
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
        startX: 0, startY: 0,
        currentX: 0, currentY: 0,
        deltaX: 0, deltaY: 0,
    });

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        stateRef.current = {
            isDragging: true,
            startX: e.clientX, startY: e.clientY,
            currentX: e.clientX, currentY: e.clientY,
            deltaX: 0, deltaY: 0,
        };
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!stateRef.current.isDragging) return;
        stateRef.current = {
            ...stateRef.current,
            currentX: e.clientX, currentY: e.clientY,
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

    return { onMouseDown, onMouseMove, onMouseUp, getState: () => stateRef.current };
}
