/**
 * Product Detail (Aura Elite Edition - Refactored)
 * Slim orchestration layer using modular sub-components.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { AuraBadge } from '../components/ui/Aura';

// Hooks & Data
import { useProductDetail } from '../hooks/useProductDetail';
import { MOCK_PRODUCT_DETAILS } from '../data/productDetails';

// Sub-components
import { ProductHero } from '../components/product/ProductHero';
import { ProductInfo } from '../components/product/ProductInfo';
import { ProductPricing } from '../components/product/ProductPricing';
import { ProductActions } from '../components/product/ProductActions';
import { ProductTabs } from '../components/product/ProductTabs';
import { useTranslation } from '@/hooks';
import { SEOHead } from '../components/seo/seo-head';
import { ProductSchema } from '../components/seo/structured-data';

export const ProductDetail: React.FC = () => {
    const { t } = useTranslation();
    const {
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
    } = useProductDetail();

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-zinc-900 rounded-[2rem] mb-10 flex items-center justify-center border border-white/5 shadow-2xl"
                >
                    <Package className="w-10 h-10 text-zinc-600" />
                </motion.div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">{t('productdetail.identity_missing')}</h2>
                <p className="text-zinc-500 mb-12 max-w-sm text-sm font-bold uppercase tracking-widest">{t('productdetail.the_requested_product_node_is')}</p>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="bg-white text-zinc-950 px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] italic"
                >
                    {t('productdetail.revert_to_marketplace')}</button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-32 max-w-7xl mx-auto px-6 lg:px-12 pt-8"
        >
            <SEOHead
                title={`${product.name} - WellNexus`}
                description={product.description}
                ogImage={product.imageUrl}
            />
            <ProductSchema
                name={product.name}
                description={product.description}
                image={product.imageUrl}
                price={product.price}
                availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <button
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-4 text-zinc-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.3em] group italic"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                    {t('productdetail.back_to_command_registry')}</button>
                <div className="flex gap-3">
                    <AuraBadge color="emerald">{t('productdetail.verified_node')}</AuraBadge>
                    <AuraBadge color="violet">{t('productdetail.premium_tier')}</AuraBadge>
                </div>
            </div>

            <div className="bg-zinc-950 rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-500/5 rounded-full blur-[150px] -mr-48 -mt-48 pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10">
                    <ProductHero product={product} outOfStock={outOfStock} />

                    <div className="p-12 lg:p-20 flex flex-col justify-center bg-zinc-950">
                        <ProductInfo product={product} />
                        <ProductPricing product={product} commissionAmount={commissionAmount} />
                        <ProductActions
                            onShare={handleShare}
                            onBuy={handleBuy}
                            isBuying={isBuying}
                            showSuccess={showSuccess}
                            outOfStock={outOfStock}
                        />
                    </div>
                </div>

                <ProductTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    details={MOCK_PRODUCT_DETAILS}
                />
            </div>
        </motion.div>
    );
};
