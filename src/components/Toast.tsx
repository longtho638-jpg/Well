/**
 * Toast Notification System
 * Phase 9: Events and Notifications
 */

import { create } from 'zustand';

// ============================================================================
// TOAST TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastState {
    toasts: Toast[];
    add: (toast: Omit<Toast, 'id'>) => string;
    remove: (id: string) => void;
    clear: () => void;
}

// ============================================================================
// TOAST STORE
// ============================================================================

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],

    add: (toast) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const newToast: Toast = { ...toast, id };

        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));

        // Auto-remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                get().remove(id);
            }, duration);
        }

        return id;
    },

    remove: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },

    clear: () => {
        set({ toasts: [] });
    },
}));

// ============================================================================
// TOAST HELPERS
// ============================================================================

export const toast = {
    success: (title: string, message?: string) =>
        useToastStore.getState().add({ type: 'success', title, message }),

    error: (title: string, message?: string) =>
        useToastStore.getState().add({ type: 'error', title, message, duration: 8000 }),

    warning: (title: string, message?: string) =>
        useToastStore.getState().add({ type: 'warning', title, message }),

    info: (title: string, message?: string) =>
        useToastStore.getState().add({ type: 'info', title, message }),

    promise: async<T>(
        promise: Promise<T>,
        messages: {
        loading: string;
        success: string;
        error: string;
    }
    ): Promise<T> => {
    const id = useToastStore.getState().add({
        type: 'info',
        title: messages.loading,
        duration: 0,
    });

    try {
        const result = await promise;
        useToastStore.getState().remove(id);
        toast.success(messages.success);
        return result;
    } catch (error) {
        useToastStore.getState().remove(id);
        toast.error(messages.error, error instanceof Error ? error.message : undefined);
        throw error;
    }
},
};

// ============================================================================
// TOAST COMPONENT
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgColors: Record<ToastType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

export function ToastContainer() {
    const { toasts, remove } = useToastStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColors[t.type]}`}
                    >
                        {icons[t.type]}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                            {t.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t.message}</p>
                            )}
                            {t.action && (
                                <button
                                    onClick={t.action.onClick}
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                                >
                                    {t.action.label}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => remove(t.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
