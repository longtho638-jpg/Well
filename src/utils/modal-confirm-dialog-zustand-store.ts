/**
 * Modal Confirm Dialog Zustand Store — promise-based confirmation dialog with variant support (danger/warning/info) and useConfirm hook
 */

import { create } from 'zustand';

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
