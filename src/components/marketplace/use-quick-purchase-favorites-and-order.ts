/**
 * useQuickPurchaseFavoritesAndOrder hook
 * Manages favorites persistence, recent products derivation, and buy-now order logic
 * for the QuickPurchaseModal component
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/store';
import { Product } from '@/types';
import { uiLogger } from '@/utils/logger';

export function useQuickPurchaseFavoritesAndOrder() {
    const { transactions, products, simulateOrder } = useStore();
    const [favorites, setFavorites] = useState<string[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('wellnexus_favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                uiLogger.error('Failed to parse favorites', e);
            }
        }
    }, []);

    const toggleFavorite = (productId: string) => {
        const newFavorites = favorites.includes(productId)
            ? favorites.filter(id => id !== productId)
            : [...favorites, productId];
        setFavorites(newFavorites);
        localStorage.setItem('wellnexus_favorites', JSON.stringify(newFavorites));
    };

    const recentProducts = useMemo(() => {
        const recentIds = new Set<string>();
        transactions.forEach(tx => {
            if (tx.type === 'Direct Sale' && tx.metadata?.product_id) {
                recentIds.add(String(tx.metadata.product_id));
            }
        });
        return Array.from(recentIds)
            .map(id => products.find(p => p.id === id))
            .filter((p): p is Product => !!p)
            .slice(0, 6);
    }, [transactions, products]);

    const favoriteProducts = useMemo(() => {
        return favorites
            .map(id => products.find(p => p.id === id))
            .filter((p): p is Product => !!p);
    }, [favorites, products]);

    const handleBuyNow = async (product: Product) => {
        setProcessingId(product.id);
        try {
            await new Promise(r => setTimeout(r, 1000));
            await simulateOrder(product.id);
            if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
            processingTimerRef.current = setTimeout(() => setProcessingId(null), 1000);
        } catch (error) {
            uiLogger.error('Purchase failed', error);
            setProcessingId(null);
        }
    };

    return {
        favorites,
        processingId,
        recentProducts,
        favoriteProducts,
        toggleFavorite,
        handleBuyNow,
    };
}
