
import React from 'react';
import { Product } from '../../types';
import { formatVND } from '../../utils/format';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

interface Props {
  products: Product[];
}

export const TopProducts: React.FC<Props> = ({ products }) => {
    const { t } = useTranslation();
  const maxSales = Math.max(...products.map(p => p.salesCount));

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-sm h-[340px] overflow-y-auto"
    >
      <h3 className="font-bold text-lg text-white mb-1">{t('topproducts.top_products')}</h3>
      <p className="text-zinc-500 text-xs mb-6">{t('topproducts.based_on_units_sold')}</p>

      <div className="space-y-6">
        {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3">
                <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                        <p className="text-sm font-bold text-white truncate">{product.name}</p>
                        <p className="text-xs font-medium text-zinc-400">{product.salesCount} {t('topproducts.sold')}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-teal-400 h-full rounded-full"
                            style={{ width: `${(product.salesCount / maxSales) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 text-right">{t('topproducts.earn')}{formatVND(product.price * product.commissionRate)}</p>
                </div>
            </div>
        ))}
      </div>
    </motion.div>
  );
};
