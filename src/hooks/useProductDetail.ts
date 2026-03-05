import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { checkCompliance } from '../services/geminiService';
import { useToast } from '@/components/ui/Toast';

export type ProductDetailTab = 'benefits' | 'ingredients' | 'usage';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { products, simulateOrder, user } = useStore();
    const { showToast } = useToast();

    const product = useMemo(() => products.find(p => p.id === id), [products, id]);
    const [activeTab, setActiveTab] = useState<ProductDetailTab>('benefits');
    const [isBuying, setIsBuying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const mountedRef = useRef(true);
    const buyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (buyTimeoutRef.current) clearTimeout(buyTimeoutRef.current);
        };
    }, []);

    const handleBuy = useCallback(async () => {
        if (!product || product.stock <= 0) return;
        setIsBuying(true);

        // Simulation delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));
        await simulateOrder(product.id);

        if (!mountedRef.current) return;
        setIsBuying(false);
        setShowSuccess(true);
        if (buyTimeoutRef.current) clearTimeout(buyTimeoutRef.current);
        buyTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) setShowSuccess(false);
        }, 2000);
    }, [product, simulateOrder]);

    const handleShare = useCallback(() => {
        if (!product) return;
        const userRef = user?.id ? `ref/${user.id}/` : '';
        const shareUrl = `wellnexus.vn/${userRef}product/${product.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Link copied: ${shareUrl}`, 'success');
        });
        checkCompliance(product.description);
    }, [product, user, showToast]);

    const commissionAmount = useMemo(() => {
        if (!product) return 0;
        return product.price * product.commissionRate;
    }, [product]);

    const outOfStock = useMemo(() => {
        return !product || product.stock <= 0;
    }, [product]);

    return {
        product,
        activeTab,
        setActiveTab,
        isBuying,
        showSuccess,
        commissionAmount,
        outOfStock,
        handleBuy,
        handleShare,
        navigate
    };
}
