import React from 'react';
import { motion } from 'framer-motion';
import { Package, Pill, ShoppingCart } from 'lucide-react';
import { ProductRecommendation } from '@/hooks/useHealthCoach';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface ProductRecommendationCardProps {
    recommendation: ProductRecommendation;
    onOrder: () => void;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({ recommendation, onOrder }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-block w-full max-w-lg"
        >
            <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        {recommendation.comboName}
                    </h3>
                </div>

                <div className="space-y-3 mb-4">
                    {recommendation.products.map((product) => (
                        <div
                            key={product.id}
                            className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700"
                        >
                            <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{product.name}</span>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatVND(product.price)}
                            </span>
                        </div>
                    ))}
                    <div className="bg-emerald-500/10 rounded-xl p-3 flex justify-between items-center border-2 border-emerald-500/20">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{t('healthCoach.totalLabel')}</span>
                        <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                            {formatVND(recommendation.totalPrice)}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 italic bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    💡 {recommendation.reason}
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOrder}
                    className="w-full bg-gradient-to-r from-primary to-teal-600 text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {t('healthCoach.orderNow')}
                </motion.button>
            </div>
        </motion.div>
    );
};
