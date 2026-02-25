import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Loader2 } from 'lucide-react';
import { formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface RedemptionItem {
    id: string;
    name: string;
    growCost: number;
    imageUrl: string;
    category: string;
    description: string;
    stock: number;
    isAvailable: boolean;
}

interface RedemptionZoneProps {
    items: RedemptionItem[];
    userGrowBalance: number;
    onRedeem: (id: string) => Promise<void>;
}

export const RedemptionZone: React.FC<RedemptionZoneProps> = ({
    items,
    userGrowBalance,
    onRedeem,
}) => {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'electronics' | 'travel' | 'education' | 'experience'>('all');
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    const categories: Array<{ id: 'all' | 'electronics' | 'travel' | 'education' | 'experience', label: string, icon: string }> = [
        { id: 'all', label: t('redemptionzone.categories.all'), icon: '🎁' },
        { id: 'electronics', label: t('redemptionzone.categories.tech'), icon: '📱' },
        { id: 'travel', label: t('redemptionzone.categories.travel'), icon: '✈️' },
        { id: 'education', label: t('redemptionzone.categories.courses'), icon: '📚' },
    ];

    const filteredItems = items.filter(i => selectedCategory === 'all' || i.category === selectedCategory);

    const handleRedeem = async (id: string) => {
        setRedeemingId(id);
        try {
            await onRedeem(id);
        } finally {
            setRedeemingId(null);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20 rounded-[3rem] p-10 backdrop-blur-sm">
                <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
                        <Award className="text-purple-500" size={48} />
                        {t('redemptionzone.grow_rewards')}</h2>
                    <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-lg">
                        {t('redemptionzone.s_d_ng_grow_token_t_ch_l_y_t')}</p>
                </div>
                <div className="bg-zinc-900 border border-purple-500/30 rounded-[2rem] p-8 text-center shadow-2xl shadow-purple-950/40 transform rotate-2">
                    <div className="text-xs text-purple-400 font-black uppercase tracking-widest mb-2">{t('redemptionzone.s_d_hi_n_t_i')}</div>
                    <div className="text-5xl font-black text-white mb-2 flex items-center justify-center gap-3">
                        <Zap className="text-yellow-400 fill-yellow-400" size={32} />
                        {formatNumber(userGrowBalance)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">{t('redemptionzone.grow_tokens')}</div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${selectedCategory === cat.id
                            ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-purple-500/50'
                            }`}
                    >
                        <span className="text-xl">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredItems.map((item) => {
                    const canAfford = userGrowBalance >= item.growCost;
                    const isProcessing = redeemingId === item.id;

                    return (
                        <motion.div
                            key={item.id}
                            whileHover={{ y: -8 }}
                            className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl"
                        >
                            <div className="relative h-60 overflow-hidden">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-yellow-400 font-black text-sm border border-yellow-500/30 flex items-center gap-2">
                                    <Award size={16} />
                                    {formatNumber(item.growCost)}
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-xl font-black text-white mb-3 line-clamp-1">{item.name}</h3>
                                <p className="text-zinc-500 text-sm font-medium line-clamp-2 mb-6 h-10">{item.description}</p>

                                <button
                                    disabled={!canAfford || !item.isAvailable || isProcessing}
                                    onClick={() => handleRedeem(item.id)}
                                    className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl ${canAfford
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-900/40'
                                        : 'bg-zinc-800 text-zinc-600 grayscale'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                    {canAfford ? t('redemptionzone.redeem_reward') : t('redemptionzone.not_enough_grow')}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
