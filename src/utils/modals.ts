/**
 * Modal Utilities — Zustand modal registry with open/close/closeAll, useModal hook, confirm dialog, and drawer store
 * Phase 17: Forms and Tables
 */

import { create } from 'zustand';
import { ReactNode, useCallback } from 'react';

export { useConfirmStore, useConfirm } from './modal-confirm-dialog-zustand-store';
export { useDrawerStore, useDrawer } from './modal-drawer-zustand-store-with-position-and-size';

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
