import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, Product, NewProductDto } from '@/services/productService';
import { useToast } from '@/components/ui/Toast';

export function useProducts() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const { data: products = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['products'],
        queryFn: productService.getProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Handle fetch error side effect
    useEffect(() => {
        if (error) {
            showToast('Failed to load products', 'error');
        }
    }, [error, showToast]);

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => productService.updateProduct(id, updates),
        onMutate: (variables) => {
            setActionLoadingId(variables.id);
        },
        onSuccess: () => {
             showToast('Product updated', 'success');
             queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: () => {
            showToast('Failed to update', 'error');
        },
        onSettled: () => {
            setActionLoadingId(null);
        }
    });

    const createMutation = useMutation({
        mutationFn: (dto: NewProductDto) => productService.createProduct(dto),
        onMutate: () => {
            setActionLoadingId('new');
        },
        onSuccess: () => {
            showToast('Product created', 'success');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
         onError: () => {
            showToast('Failed to create', 'error');
        },
        onSettled: () => {
            setActionLoadingId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productService.deleteProduct(id),
        onMutate: (id) => {
             setActionLoadingId(id);
        },
        onSuccess: () => {
            showToast('Product deleted', 'info');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: () => {
            showToast('Failed to delete', 'error');
        },
        onSettled: () => {
            setActionLoadingId(null);
        }
    });

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

    const handleUpdate = async (id: string, updates: Partial<Product>) => {
        try {
            await updateMutation.mutateAsync({ id, updates });
            return true;
        } catch {
            return false;
        }
    };

    const handleCreate = async (dto: NewProductDto) => {
        try {
             await createMutation.mutateAsync(dto);
             return true;
        } catch {
            return false;
        }
    };

    const handleDelete = async (id: string, name: string) => {
         if (!confirm(`Delete "${name}"?`)) return;
         try {
             await deleteMutation.mutateAsync(id);
         } catch {
             // error handled in mutation
         }
    };

    return {
        products,
        loading,
        actionLoading: actionLoadingId,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        stats,
        refresh: refetch,
        handleUpdate,
        handleCreate,
        handleDelete
    };
}
