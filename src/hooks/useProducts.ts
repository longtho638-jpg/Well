import { useState, useEffect, useCallback, useMemo } from 'react';
import { productService, Product, NewProductDto } from '@/services/productService';
import { useToast } from '@/components/ui/Toast';

export function useProducts() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productService.getProducts();
            setProducts(data);
        } catch {
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return products.filter((p) =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    const stats = useMemo(() => ({
        total: products.length,
        lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
        outOfStock: products.filter(p => p.stock === 0).length
    }), [products]);

    const handleUpdate = async (id: string, updates: Partial<Product>, vendorId?: string) => {
        setActionLoading(id);
        try {
            if (vendorId) {
                await productService.updateProduct(id, updates, vendorId);
            } else {
                await productService.updateProduct(id, updates, 'system');
            }
            setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            showToast('Product updated', 'success');
            return true;
        } catch {
            showToast('Failed to update', 'error');
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async (dto: NewProductDto) => {
        setActionLoading('new');
        try {
            await productService.createProduct(dto);
            showToast('Product created', 'success');
            fetchProducts();
            return true;
        } catch {
            showToast('Failed to create', 'error');
            return false;
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string, vendorId?: string) => {
        if (!confirm(`Delete "${name}"?`)) return;
        setActionLoading(id);
        try {
            if (vendorId) {
                await productService.deleteProduct(id, vendorId);
            } else {
                await productService.deleteProduct(id, 'system');
            }
            setProducts(prev => prev.filter(p => p.id !== id));
            showToast('Product deleted', 'info');
        } catch {
            showToast('Failed to delete', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    return {
        products,
        loading,
        actionLoading,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        stats,
        refresh: fetchProducts,
        handleUpdate,
        handleCreate,
        handleDelete
    };
}
