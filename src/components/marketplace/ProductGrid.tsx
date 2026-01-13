import React from 'react';
import { BentoGrid, BentoCard, AuraBadge } from '@/components/ui/Aura';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface ProductGridProps {
    products: Product[];
    recommendedIds: string[];
    onAddToCart: (p: Product) => void;
    onViewDetail: (id: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
    products,
    recommendedIds,
    onAddToCart,
    onViewDetail,
}) => {
    const { t } = useTranslation();
    return (
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => {
                const { t } = useTranslation();
                const isRecommended = recommendedIds.includes(product.id);

                return (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                        <BentoCard
                            colSpan={1}
                            className={`group relative overflow-visible h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 ${isRecommended ? 'ring-2 ring-amber-500/50' : ''
                                }`}
                        >
                            {isRecommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <AuraBadge color="pink">{t('productgrid.ai_recommended')}</AuraBadge>
                                </div>
                            )}

                            {/* Image Container */}
                            <div className="relative h-72 overflow-hidden rounded-[1.8rem] m-2">
                                <motion.img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Float Action */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-[2px]">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onAddToCart(product)}
                                        className="bg-white text-zinc-900 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-tighter flex items-center gap-2.5 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {t('productgrid.add_to_cart')}</motion.button>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-7">
                                <div className="mb-4">
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white line-clamp-1 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 h-10 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between mt-auto">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{t('productgrid.price')}</div>
                                        <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                            {formatVND(product.price)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                                            +{product.commissionRate * 100}{t('productgrid.commission')}</div>
                                        <button
                                            onClick={() => onViewDetail(product.id)}
                                            className="w-12 h-12 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-zinc-900 hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>
                    </motion.div>
                );
            })}
        </BentoGrid>
    );
};
