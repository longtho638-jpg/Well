import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '../types';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;

    // Computed (helper for selector usage if needed, though usually computed in hooks)
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product, quantity = 1) => set((state) => {
                const existingItem = state.items.find(item => item.product.id === product.id);

                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            item.product.id === product.id
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        )
                    };
                }

                return {
                    items: [...state.items, { product, quantity }]
                };
            }),

            removeFromCart: (productId) => set((state) => ({
                items: state.items.filter(item => item.product.id !== productId)
            })),

            updateQuantity: (productId, quantity) => set((state) => ({
                items: state.items.map(item =>
                    item.product.id === productId
                        ? { ...item, quantity: Math.max(1, quantity) }
                        : item
                )
            })),

            clearCart: () => set({ items: [] }),

            getTotal: () => {
                const state = get();
                return state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
            },

            getItemCount: () => {
                const state = get();
                return state.items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'well-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
