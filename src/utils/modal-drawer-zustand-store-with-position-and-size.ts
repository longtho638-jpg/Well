/**
 * Modal Drawer Zustand Store with Position and Size — slide-in drawer state management supporting left/right/top/bottom positions and configurable pixel width
 */

import { create } from 'zustand';
import { ReactNode } from 'react';

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
        set({ drawer: { isOpen: true, content, position, size } });
    },

    close: () => {
        set(state => ({
            drawer: { ...state.drawer, isOpen: false, content: null },
        }));
    },
}));

export function useDrawer() {
    const { drawer, open, close } = useDrawerStore();
    return { ...drawer, open, close };
}
