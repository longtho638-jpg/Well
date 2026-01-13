import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    bonus_revenue: number;
    commission_rate: number;
    image_url: string;
    sales_count: number;
    stock: number;
    category?: string;
    is_active?: boolean;
}

export interface NewProductDto {
    name: string;
    description: string;
    price: number;
    bonus_revenue: number;
    stock: number;
    image_url: string;
    category: string;
}

export const productService = {
    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false });

        if (error) {
            adminLogger.error('Failed to load products', error);
            throw error;
        }
        return data || [];
    },

    async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) {
            adminLogger.error('Failed to update product', error);
            throw error;
        }
    },

    async createProduct(product: NewProductDto): Promise<void> {
        const { error } = await supabase
            .from('products')
            .insert({
                ...product,
                sales_count: 0,
                commission_rate: 0.21,
                is_active: true
            });

        if (error) {
            adminLogger.error('Failed to add product', error);
            throw error;
        }
    },

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            adminLogger.error('Failed to delete product', error);
            throw error;
        }
    }
};
