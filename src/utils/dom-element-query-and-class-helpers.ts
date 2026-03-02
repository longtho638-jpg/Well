/**
 * DOM element query helpers, class manipulation, hover/focus/size hooks.
 * Extracted from utils/dom.ts to keep it under 200 LOC.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Element Queries ─────────────────────────────────────────────

export function $(selector: string): Element | null {
    return document.querySelector(selector);
}

export function $$(selector: string): Element[] {
    return Array.from(document.querySelectorAll(selector));
}

export function getById(id: string): HTMLElement | null {
    return document.getElementById(id);
}

// ─── Class Manipulation ───────────────────────────────────────────

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

// ─── Click Outside Hook ───────────────────────────────────────────

export function useClickOutside<T extends HTMLElement>(
    callback: () => void
): React.RefObject<T | null> {
    const ref = useRef<T>(null);
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) callback();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);
    return ref;
}

// ─── Element Size Hook ────────────────────────────────────────────

interface ElementSize { width: number; height: number; }

export function useElementSize<T extends HTMLElement>(): [React.RefObject<T | null>, ElementSize] {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return [ref, size];
}

// ─── Hover Hook ───────────────────────────────────────────────────

export function useHover<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
    const ref = useRef<T>(null);
    const [isHovered, setIsHovered] = useState(false);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const onEnter = () => setIsHovered(true);
        const onLeave = () => setIsHovered(false);
        element.addEventListener('mouseenter', onEnter);
        element.addEventListener('mouseleave', onLeave);
        return () => {
            element.removeEventListener('mouseenter', onEnter);
            element.removeEventListener('mouseleave', onLeave);
        };
    }, []);
    return [ref, isHovered];
}

// ─── Focus Hook ───────────────────────────────────────────────────

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
        const onFocus = () => setIsFocused(true);
        const onBlur = () => setIsFocused(false);
        element.addEventListener('focus', onFocus);
        element.addEventListener('blur', onBlur);
        return () => {
            element.removeEventListener('focus', onFocus);
            element.removeEventListener('blur', onBlur);
        };
    }, []);
    const focus = useCallback(() => ref.current?.focus(), []);
    const blur = useCallback(() => ref.current?.blur(), []);
    return [ref, isFocused, { focus, blur }];
}
