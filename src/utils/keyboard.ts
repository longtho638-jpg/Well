/**
 * Keyboard Utilities
 * Phase 16: Keyboard and Gestures
 */

import { useEffect, useRef } from 'react';

// ============================================================================
// KEY CODES
// ============================================================================

export const Keys = {
    Enter: 'Enter',
    Escape: 'Escape',
    Space: ' ',
    Tab: 'Tab',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
} as const;

// ============================================================================
// KEYBOARD SHORTCUT HOOK
// ============================================================================

interface ShortcutOptions {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    preventDefault?: boolean;
    enabled?: boolean;
}

export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options: ShortcutOptions = {}
): void {
    const { ctrl, alt, shift, meta, preventDefault = true, enabled = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const handler = (event: KeyboardEvent) => {
            const keyMatch = event.key.toLowerCase() === key.toLowerCase();
            const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
            const altMatch = alt ? event.altKey : !event.altKey;
            const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
            const metaMatch = meta ? event.metaKey : true; // meta is optional

            if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
                if (preventDefault) event.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [key, callback, ctrl, alt, shift, meta, preventDefault, enabled]);
}

// ============================================================================
// MULTIPLE SHORTCUTS
// ============================================================================

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(
    shortcuts: ShortcutMap,
    options: Omit<ShortcutOptions, 'ctrl' | 'alt' | 'shift' | 'meta'> = {}
): void {
    const { preventDefault = true, enabled = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const handler = (event: KeyboardEvent) => {
            // Build key combo string
            const combo = [
                event.ctrlKey || event.metaKey ? 'ctrl' : '',
                event.altKey ? 'alt' : '',
                event.shiftKey ? 'shift' : '',
                event.key.toLowerCase(),
            ].filter(Boolean).join('+');

            if (shortcuts[combo]) {
                if (preventDefault) event.preventDefault();
                shortcuts[combo]();
            }

            // Also check just the key
            if (shortcuts[event.key.toLowerCase()]) {
                if (preventDefault) event.preventDefault();
                shortcuts[event.key.toLowerCase()]();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [shortcuts, preventDefault, enabled]);
}

// ============================================================================
// KEY PRESS HOOK
// ============================================================================

export function useKeyPress(targetKey: string): boolean {
    const pressed = useRef(false);

    useEffect(() => {
        const downHandler = (event: KeyboardEvent) => {
            if (event.key === targetKey) pressed.current = true;
        };

        const upHandler = (event: KeyboardEvent) => {
            if (event.key === targetKey) pressed.current = false;
        };

        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);

        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, [targetKey]);

    return pressed.current;
}

// ============================================================================
// ESCAPE KEY
// ============================================================================

export function useEscapeKey(callback: () => void, enabled = true): void {
    useKeyboardShortcut('Escape', callback, { enabled, preventDefault: false });
}

// ============================================================================
// ENTER KEY
// ============================================================================

export function useEnterKey(callback: () => void, enabled = true): void {
    useKeyboardShortcut('Enter', callback, { enabled });
}

// ============================================================================
// COMMON APP SHORTCUTS
// ============================================================================

export function useAppShortcuts(handlers: {
    onSearch?: () => void;
    onSave?: () => void;
    onNew?: () => void;
    onClose?: () => void;
}): void {
    useKeyboardShortcuts({
        'ctrl+k': handlers.onSearch || (() => { }),
        'ctrl+s': handlers.onSave || (() => { }),
        'ctrl+n': handlers.onNew || (() => { }),
        'escape': handlers.onClose || (() => { }),
    });
}
