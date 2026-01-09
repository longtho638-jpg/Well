import { useEffect, useCallback } from 'react';

type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    handler: () => void;
    description?: string;
};

/**
 * Custom hook for handling keyboard shortcuts
 * Supports modifier keys: Ctrl, Cmd (Meta), Shift, Alt
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
                const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.handler();
                    break;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Predefined common shortcuts for the app
export const APP_SHORTCUTS = {
    SEARCH: { key: 'k', meta: true, description: 'Open search / command palette' },
    ESCAPE: { key: 'Escape', description: 'Close modal / cancel action' },
    HOME: { key: 'h', meta: true, shift: true, description: 'Go to dashboard' },
    THEME: { key: 't', meta: true, shift: true, description: 'Toggle theme' },
};

export default useKeyboardShortcuts;
