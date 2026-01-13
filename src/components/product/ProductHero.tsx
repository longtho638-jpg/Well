/**
 * ProductHero - High-fidelity image engine
 * Displays the product image with gradient backgrounds and out-of-stock overlay.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { useTranslation } from '@/hooks';

interface Props {
    product: Product;
    outOfStock: boolean;
}

export const ProductHero: React.FC<Props> = ({ product, outOfStock }) => {
    const { t } = useTranslation();
    return (
        <div className="relative bg-zinc-900/30 flex items-center justify-center p-12 lg:p-20 min-h-[600px] border-r border-white/5">
            <div className="absolute inset-x-8 inset-y-8 rounded-[3rem] border border-white/5 opacity-50 pointer-events-none" />
            <motion.img
                layoutId={`product-image-${product.id}`}
                src={product.imageUrl}
                alt={product.name}
                className={`w-full max-h-[500px] object-contain transition-all duration-1000 ${outOfStock ? 'grayscale opacity-20' : 'hover:scale-110 drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]'}`}
            />
            {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="bg-white text-zinc-950 text-[10px] font-black px-12 py-4 rounded-full uppercase tracking-[0.3em] shadow-2xl skew-x-[-12deg]">{t('producthero.logistics_depleted')}</span>
                </div>
            )}
        </div>
    );
};
