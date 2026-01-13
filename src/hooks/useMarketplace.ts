import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { Product } from '../types';
import { useTranslation } from '../hooks';

export interface CartItem {
    product: Product;
    quantity: number;
}

export type PriceRange = 'all' | 'low' | 'medium' | 'high';
export type ProductCategory = 'all' | 'health' | 'wellness' | 'supplement';

export function useMarketplace() {
    const { t } = useTranslation();
    const { products, user, redemptionItems, redeemItem } = useStore();

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

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);

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
        const triggerAi = async () => {
            if (products.length === 0) return;
            setLoadingAi(true);
            await new Promise(r => setTimeout(r, 1200));

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
    }, [products, t]);

    // Cart Actions
    const addToCart = useCallback((product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setShowCart(true);
    }, []);

    const updateQuantity = useCallback((productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }).filter(i => i.quantity > 0));
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    }, []);

    // Totals
    const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.product.price * i.quantity), 0), [cart]);
    const cartItemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

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
