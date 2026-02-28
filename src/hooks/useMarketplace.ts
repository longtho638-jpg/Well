import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types';
import { useTranslation } from './useTranslation';

export type CartItem = import('../store/cartStore').CartItem;

export type PriceRange = 'all' | 'low' | 'medium' | 'high';
export type ProductCategory = 'all' | 'health' | 'wellness' | 'supplement';

export function useMarketplace() {
    const { t } = useTranslation();
    const { products, user, redemptionItems, redeemItem } = useStore();

    // Use Persistent Cart Store
    const cart = useCartStore(state => state.items);
    const addToCartStore = useCartStore(state => state.addToCart);
    const removeFromCartStore = useCartStore(state => state.removeFromCart);
    const updateQuantityStore = useCartStore(state => state.updateQuantity);
    const cartTotal = useCartStore(state => state.getTotal());
    const cartItemCount = useCartStore(state => state.getItemCount());

    const [searchTerm, setSearchTerm] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState<{ text: string; productIds: string[] } | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    // UI State
    const [showRedemption, setShowRedemption] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showCart, setShowCart] = useState(false);

    // Filter state
    const [priceRange, setPriceRange] = useState<PriceRange>('all');
    const [category, setCategory] = useState<ProductCategory>('all');

    // Derived: Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesPrice = true;
            if (priceRange === 'low') matchesPrice = p.price < 5000000;
            else if (priceRange === 'medium') matchesPrice = p.price >= 5000000 && p.price < 15000000;
            else if (priceRange === 'high') matchesPrice = p.price >= 15000000;

            let matchesCat = true;
            if (category !== 'all') {
                matchesCat = p.name.toLowerCase().includes(category);
            }

            return matchesSearch && matchesPrice && matchesCat;
        });
    }, [products, searchTerm, priceRange, category]);

    // AI Logic
    useEffect(() => {
        if (products.length === 0) return;
        let cancelled = false;
        const triggerAi = async () => {
            setLoadingAi(true);
            await new Promise(r => setTimeout(r, 1200));
            if (cancelled) return;

            const suggested = products.find(p => p.commissionRate >= 0.25);
            if (suggested) {
                setAiSuggestion({
                    text: t('marketplace.aiRecommendation.suggestion', {
                        productName: suggested.name,
                        commission: (suggested.commissionRate * 100).toString()
                    }),
                    productIds: [suggested.id]
                });
            }
            setLoadingAi(false);
        };
        triggerAi();
        return () => { cancelled = true; };
    }, [products, t]);

    // Cart Actions Wrappers
    const addToCart = useCallback((product: Product) => {
        addToCartStore(product);
        setShowCart(true);
    }, [addToCartStore]);

    const updateQuantity = useCallback((productId: string, delta: number) => {
        const item = cart.find(i => i.product.id === productId);
        if (item) {
            updateQuantityStore(productId, item.quantity + delta);
        }
    }, [cart, updateQuantityStore]);

    const removeFromCart = useCallback((productId: string) => {
        removeFromCartStore(productId);
    }, [removeFromCartStore]);

    return {
        // State
        user,
        products: filteredProducts,
        allRedemptionItems: redemptionItems,
        searchTerm,
        setSearchTerm,
        priceRange,
        setPriceRange,
        category,
        setCategory,
        aiSuggestion,
        loadingAi,
        cart,
        showRedemption,
        setShowRedemption,
        showFilters,
        setShowFilters,
        showCart,
        setShowCart,

        // Actions
        addToCart,
        updateQuantity,
        removeFromCart,
        redeemItem,

        // Totals
        cartTotal,
        cartItemCount,
        t
    };
}
