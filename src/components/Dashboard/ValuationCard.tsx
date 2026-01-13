import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Coins, Crown } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

import { User } from '@/types';

interface ValuationCardProps {
    user: User;
}

export const ValuationCard: React.FC<ValuationCardProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="relative overflow-hidden rounded-[3rem] shadow-2xl group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 group-hover:scale-105 transition-transform duration-[2s]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />

            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-black/10 rounded-full blur-[80px] -ml-24 -mb-24" />

            <div className="relative z-10 p-10 md:p-14">
                <div className="grid lg:grid-cols-5 gap-12 items-center">
                    <div className="lg:col-span-3 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                                <BarChart3 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-[0.3em] italic mb-1">
                                    {t('dashboard.valuation.title')}
                                </p>
                                <p className="text-xs text-white/70 font-bold uppercase tracking-widest">
                                    {t('dashboard.valuation.subtitle')}
                                </p>
                            </div>
                        </div>

                        <div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-6xl md:text-8xl font-black text-white tracking-tighter italic drop-shadow-2xl"
                            >
                                {formatVND(user.businessValuation || 0)}
                            </motion.div>
                            <div className="flex items-center gap-6 mt-6">
                                <div className="px-6 py-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3 shadow-xl">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                    <span className="text-sm font-black text-white italic">
                                        +{user.assetGrowthRate || 5}{t('valuationcard.mom_growth')}</span>
                                </div>
                                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                    {t('dashboard.valuation.formula')}
                                    <span className="block text-white/50 lowercase mt-0.5 italic">
                                        ({formatVND(user.monthlyProfit || 0)} {t('valuationcard.12_5_pe_ratio')}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-black/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                            <h3 className="text-white font-black text-lg uppercase italic tracking-wider flex items-center gap-3 border-b border-white/10 pb-4">
                                <Coins className="w-6 h-6 text-white/70" />
                                {t('dashboard.valuation.assetBreakdown')}
                            </h3>

                            <div className="space-y-6">
                                {[
                                    { label: t('dashboard.valuation.cashflow'), sub: 'SHOP Token Liquidity', val: user.cashflowValue || 0, color: 'text-amber-200' },
                                    { label: t('dashboard.valuation.equity'), sub: 'GROW Token Yield', val: user.equityValue || 0, color: 'text-white' },
                                    { label: t('dashboard.valuation.projectedAnnual'), sub: 'Annualized Revenue Rate', val: user.projectedAnnualProfit || 0, color: 'text-white/90' }
                                ].map((asset, idx) => (
                                    <div key={idx} className="flex items-center justify-between group/asset">
                                        <div>
                                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1 group-hover/asset:text-white/80 transition-colors">
                                                {asset.label}
                                            </p>
                                            <p className="text-white/90 text-xs font-bold italic">{asset.sub}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-xl italic tracking-tight ${asset.color}`}>
                                                {formatVND(asset.val)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full mt-4 bg-white text-orange-600 font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl hover:bg-zinc-50 transition-all italic border-b-4 border-orange-700/20"
                            >
                                <Crown className="w-5 h-5" />
                                {t('dashboard.valuation.upgradePortfolio')}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
