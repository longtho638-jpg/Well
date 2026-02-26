/**
 * Product Slice - Product Catalog & Marketplace
 */

import { StateCreator } from 'zustand';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';

export interface ProductState {
    products: Product[];
    categories: string[];
}

export interface ProductActions {
    fetchProducts: () => Promise<void>;
    setProducts: (products: Product[]) => void;
}

export type ProductSlice = ProductState & ProductActions;

export const createProductSlice: StateCreator<
    ProductSlice,
    [],
    [],
    ProductSlice
> = (set) => ({
    products: [],
    categories: ['health', 'supplements', 'equipment'],

    setProducts: (products) => set({ products }),

    fetchProducts: async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false });

        if (data && data.length > 0) {
            const products: Product[] = data.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.price,
                commissionRate: p.commission_rate || 0.25,
                bonusRevenue: p.bonus_revenue || p.price * 0.5,
                imageUrl: p.image_url || 'https://placehold.co/400',
                salesCount: p.sales_count || 0,
                stock: p.stock || 100,
                isNew: false,
                rating: 4.5,
                category: 'health'
            }));
            set({ products });
        }
    },
});
