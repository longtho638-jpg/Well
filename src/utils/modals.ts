/**
 * Modal Utilities
 * Phase 17: Forms and Tables
 */

import { create } from 'zustand';
import { ReactNode, useCallback } from 'react';

// ============================================================================
// MODAL STORE
// ============================================================================

interface ModalState {
    isOpen: boolean;
    content: ReactNode | null;
    options: ModalOptions;
}

interface ModalOptions {
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showClose?: boolean;
    onClose?: () => void;
}

interface ModalStore {
    modals: Map<string, ModalState>;
    open: (id: string, content: ReactNode, options?: ModalOptions) => void;
    close: (id: string) => void;
    closeAll: () => void;
    isOpen: (id: string) => boolean;
}

export const useModalStore = create<ModalStore>((set, get) => ({
    modals: new Map(),

    open: (id, content, options = {}) => {
        set(state => {
            const newModals = new Map(state.modals);
            newModals.set(id, {
                isOpen: true,
                content,
                options: {
                    size: 'md',
                    closeOnOverlay: true,
                    closeOnEscape: true,
                    showClose: true,
                    ...options,
                },
            });
            return { modals: newModals };
        });
    },

    close: (id) => {
        set(state => {
            const modal = state.modals.get(id);
            modal?.options.onClose?.();

            const newModals = new Map(state.modals);
            newModals.delete(id);
            return { modals: newModals };
        });
    },

    closeAll: () => {
        const { modals } = get();
        modals.forEach(modal => modal.options.onClose?.());
        set({ modals: new Map() });
    },

    isOpen: (id) => get().modals.has(id),
}));

// ============================================================================
// MODAL HOOK
// ============================================================================

export function useModal(id: string) {
    const { open, close, modals } = useModalStore();
    const modal = modals.get(id);

    return {
        isOpen: !!modal?.isOpen,
        content: modal?.content,
        options: modal?.options,
        open: useCallback(
            (content: ReactNode, options?: ModalOptions) => open(id, content, options),
            [id, open]
        ),
        close: useCallback(() => close(id), [id, close]),
    };
}

// ============================================================================
// CONFIRMATION DIALOG
// ============================================================================

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

let confirmResolver: ((value: boolean) => void) | null = null;

export const useConfirmStore = create<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    open: (options: ConfirmOptions) => Promise<boolean>;
    confirm: () => void;
    cancel: () => void;
}>((set) => ({
    isOpen: false,
    options: null,

    open: (options) => {
        return new Promise((resolve) => {
            confirmResolver = resolve;
            set({
                isOpen: true,
                options: {
                    title: 'Xác nhận',
                    confirmText: 'Đồng ý',
                    cancelText: 'Hủy',
                    variant: 'info',
                    ...options,
                },
            });
        });
    },

    confirm: () => {
        confirmResolver?.(true);
        confirmResolver = null;
        set({ isOpen: false, options: null });
    },

    cancel: () => {
        confirmResolver?.(false);
        confirmResolver = null;
        set({ isOpen: false, options: null });
    },
}));

export function useConfirm() {
    const { open } = useConfirmStore();
    return open;
}

// ============================================================================
// DRAWER STORE
// ============================================================================

interface DrawerState {
    isOpen: boolean;
    content: ReactNode | null;
    position: 'left' | 'right' | 'top' | 'bottom';
    size: number;
}

export const useDrawerStore = create<{
    drawer: DrawerState;
    open: (content: ReactNode, position?: DrawerState['position'], size?: number) => void;
    close: () => void;
}>((set) => ({
    drawer: {
        isOpen: false,
        content: null,
        position: 'right',
        size: 400,
    },

    open: (content, position = 'right', size = 400) => {
        set({
            drawer: {
                isOpen: true,
                content,
                position,
                size,
            },
        });
    },

    close: () => {
        set(state => ({
            drawer: {
                ...state.drawer,
                isOpen: false,
                content: null,
            },
        }));
    },
}));

export function useDrawer() {
    const { drawer, open, close } = useDrawerStore();
    return { ...drawer, open, close };
}
