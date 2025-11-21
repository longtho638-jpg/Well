
import React from 'react';
import { Product } from '../../types';
import { formatVND } from '../../utils/format';
import { motion } from 'framer-motion';

interface Props {
  products: Product[];
}

export const TopProducts: React.FC<Props> = ({ products }) => {
  const maxSales = Math.max(...products.map(p => p.salesCount));

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-[340px] overflow-y-auto"
    >
      <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100 mb-1">Top Products</h3>
      <p className="text-gray-400 dark:text-slate-500 text-xs mb-6">Based on units sold</p>

      <div className="space-y-6">
        {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3">
                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-slate-700" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{product.name}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{product.salesCount} sold</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-brand-primary dark:bg-teal-400 h-full rounded-full"
                            style={{ width: `${(product.salesCount / maxSales) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 text-right">Earn {formatVND(product.price * product.commissionRate)}</p>
                </div>
            </div>
        ))}
      </div>
    </motion.div>
  );
};
