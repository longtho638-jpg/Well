import React from 'react';
import { Search, ShoppingCart, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

interface MarketplaceHeaderProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    cartItemCount: number;
    onToggleFilters: () => void;
    onShowCart: () => void;
    title: string;
    searchPlaceholder: string;
    totalProducts: number;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    cartItemCount,
    onToggleFilters,
    onShowCart,
    title,
    searchPlaceholder,
    totalProducts,
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                    {title}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1 uppercase tracking-widest">
                    {totalProducts} {t('marketplaceheader.items_available')}</p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                    onClick={onToggleFilters}
                    className="p-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors lg:hidden"
                >
                    <Filter className="w-5 h-5 text-teal-500" />
                </button>

                <div className="relative flex-1 sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-sm text-zinc-900 dark:text-white transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={onShowCart}
                    className="relative p-3.5 bg-teal-600 text-white rounded-2xl hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-900/20 transition-all group"
                >
                    <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {cartItemCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white dark:border-zinc-950"
                        >
                            {cartItemCount}
                        </motion.span>
                    )}
                </button>
            </div>
        </div>
    );
};
