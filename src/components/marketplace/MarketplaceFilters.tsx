import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { PriceRange, ProductCategory } from '@/hooks/useMarketplace';
import { useTranslation } from '@/hooks';

interface MarketplaceFiltersProps {
    category: ProductCategory;
    setCategory: (c: ProductCategory) => void;
    priceRange: PriceRange;
    setPriceRange: (p: PriceRange) => void;
    onClose: () => void;
    onReset: () => void;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
    category,
    setCategory,
    priceRange,
    setPriceRange,
    onClose,
    onReset,
}) => {
    const { t } = useTranslation();
    const categories: { value: ProductCategory; label: string; icon: string }[] = [
        { value: 'all', label: 'Tất cả sản phẩm', icon: '🎁' },
        { value: 'health', label: 'Sức khỏe', icon: '💊' },
        { value: 'wellness', label: 'Wellness', icon: '🌿' },
        { value: 'supplement', label: 'Dinh dưỡng', icon: '🥗' },
    ];

    const prices: { value: PriceRange; label: string; range: string }[] = [
        { value: 'all', label: 'Tất cả giá', range: '' },
        { value: 'low', label: 'Dưới 5 triệu', range: '< 5M' },
        { value: 'medium', label: '5 - 15 triệu', range: '5-15M' },
        { value: 'high', label: 'Trên 15 triệu', range: '> 15M' },
    ];

    return (
        <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-7 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-zinc-900 dark:text-white text-xl flex items-center gap-3">
                    <SlidersHorizontal className="w-5 h-5 text-teal-400" />
                    {t('marketplacefilters.b_l_c')}</h3>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-8">
                <div>
                    <h4 className="font-bold text-zinc-500 dark:text-zinc-400 mb-4 text-xs uppercase tracking-widest">{t('marketplacefilters.danh_m_c')}</h4>
                    <div className="space-y-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`w-full px-5 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-4 ${category === cat.value
                                        ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/20'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10 border border-transparent'
                                    }`}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-zinc-500 dark:text-zinc-400 mb-4 text-xs uppercase tracking-widest">{t('marketplacefilters.kho_ng_gi')}</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {prices.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPriceRange(p.value)}
                                className={`px-5 py-4 rounded-2xl text-sm font-bold transition-all text-left flex justify-between items-center ${priceRange === p.value
                                        ? 'bg-amber-500 text-white shadow-xl shadow-amber-900/20'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-white/60 hover:bg-zinc-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                <span>{p.label}</span>
                                <span className="text-[10px] opacity-70 font-black">{p.range}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onReset}
                    className="w-full mt-4 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-sm font-black uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
                >
                    {t('marketplacefilters.t_l_i_b_l_c')}</button>
            </div>
        </div>
    );
};
