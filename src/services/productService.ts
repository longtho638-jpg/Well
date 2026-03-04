import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';
import { logAuditEvent } from '@/utils/auth';

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
    vendor_id?: string;
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
    vendor_id?: string;
}

/**
 * Product Service
 * Handles CRUD operations for marketplace products using Supabase.
 */
export const productService = {
    /**
     * Fetch all active products sorted by sales count
     * @returns Promise<Product[]> List of products
     */
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

    /**
     * Fetch products for a specific vendor
     * @param vendorId - The ID of the vendor
     * @returns Promise<Product[]> List of products belonging to the vendor
     */
    async getVendorProducts(vendorId: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('sales_count', { ascending: false });

        if (error) {
            adminLogger.error('Failed to load vendor products', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Fetch a single product by ID with vendor verification
     * @param id - Product ID
     * @param vendorId - Vendor ID for authorization check
     * @returns Promise<Product | null> The product if it belongs to the vendor, null otherwise
     */
    async getProductByIdForVendor(id: string, vendorId: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('vendor_id', vendorId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - product doesn't belong to this vendor
                return null;
            }
            adminLogger.error('Failed to load product for vendor', error);
            throw error;
        }
        return data;
    },

    /**
     * Update product details with vendor verification
     * @param id - Product ID
     * @param updates - Partial product object
     * @param vendorId - Vendor ID for authorization check
     */
    async updateProduct(id: string, updates: Partial<Product>, vendorId: string): Promise<void> {
        // First check if the product belongs to the vendor
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .eq('vendor_id', vendorId)
            .single();

        if (fetchError || !product) {
            adminLogger.error('Unauthorized product update attempt', fetchError);
            throw new Error('Unauthorized: You can only update your own products');
        }

        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) {
            adminLogger.error('Failed to update product', error);
            throw error;
        }

        // Audit log
        await logAuditEvent(vendorId, 'PRODUCT_UPDATED', 'products', id, { updates: Object.keys(updates) });
    },

    /**
     * Create a new product for a specific vendor
     * @param product - New product data
     * @param vendorId - Vendor ID to associate the product with
     */
    async createProductForVendor(product: NewProductDto, vendorId: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .insert({
                ...product,
                vendor_id: vendorId,
                sales_count: 0,
                commission_rate: 0.21,
                is_active: true
            });

        if (error) {
            adminLogger.error('Failed to add product for vendor', error);
            throw error;
        }

        // Audit log
        await logAuditEvent(vendorId, 'PRODUCT_CREATED', 'products', undefined, { productName: product.name });
    },

    /**
     * Create a new product
     * @param product - New product data
     */
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

    /**
     * Delete a product with vendor verification
     * @param id - Product ID
     * @param vendorId - Vendor ID for authorization check
     */
    async deleteProduct(id: string, vendorId: string): Promise<void> {
        // First check if the product belongs to the vendor
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('id')
            .eq('id', id)
            .eq('vendor_id', vendorId)
            .single();

        if (fetchError || !product) {
            adminLogger.error('Unauthorized product deletion attempt', fetchError);
            throw new Error('Unauthorized: You can only delete your own products');
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            adminLogger.error('Failed to delete product', error);
            throw error;
        }

        // Audit log
        await logAuditEvent(vendorId, 'PRODUCT_DELETED', 'products', id);
    }
};
