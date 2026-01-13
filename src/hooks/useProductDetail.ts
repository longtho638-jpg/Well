import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { checkCompliance } from '../services/geminiService';

export type ProductDetailTab = 'benefits' | 'ingredients' | 'usage';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { products, simulateOrder } = useStore();

    const product = useMemo(() => products.find(p => p.id === id), [products, id]);
    const [activeTab, setActiveTab] = useState<ProductDetailTab>('benefits');
    const [isBuying, setIsBuying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleBuy = useCallback(async () => {
        if (!product || product.stock <= 0) return;
        setIsBuying(true);

        // Simulation delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));
        await simulateOrder(product.id);

        setIsBuying(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    }, [product, simulateOrder]);

    const handleShare = useCallback(() => {
        if (!product) return;
        // Mock share functionality
        const shareUrl = `wellnexus.vn/ref/VN-888/product/${product.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`Link copied: ${shareUrl}`);
        });
        checkCompliance(product.description);
    }, [product]);

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
