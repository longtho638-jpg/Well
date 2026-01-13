/**
 * Revenue Progress Widget (Refactored - Aura Founder)
 * Specialized dashboard component for tracking ecosystem GMV against $1M ARR benchmarks.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, DollarSign, Users, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface RevenueProgressProps {
    currentGMV: number;
    targetGMV: number;
    currentOrders: number;
    activeDistributors: number;
}

export const RevenueProgressWidget: React.FC<RevenueProgressProps> = ({
    currentGMV,
    targetGMV,
    currentOrders,
    activeDistributors,
}) => {
    const { t } = useTranslation();
    // Calculate metrics with precision
    const progressPercent = Math.min((currentGMV / targetGMV) * 100, 100);
    const avgOrderValue = currentOrders > 0 ? currentGMV / currentOrders : 0;
    const monthlyRunRate = currentGMV * 12; // Annualized
    const ordersPerDay = currentOrders / 30;

    // $1M target calculation benchmark
    const TARGET_1M = 1000000 * 25000; // $1M in VND (benchmark)
    const progress1M = Math.min((monthlyRunRate / TARGET_1M) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950/40 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group"
        >
            {/* Background Strategic Overlay */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 blur-sm">
                <Globe size={240} className="text-white" />
            </div>

            {/* Header Stage */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-tr from-[#00575A] to-emerald-500 rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,87,90,0.4)] border border-white/10">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                            {t('revenueprogresswidget.revenue_milestone')}</h3>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">
                            {t('revenueprogresswidget.global_ecosystem_velocity')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl shadow-xl">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-black text-emerald-400 italic">{t('revenueprogresswidget.benchmark')}{progress1M.toFixed(1)}%</span>
                </div>
            </div>

            {/* Main GMV Progress Lab */}
            <div className="space-y-6 mb-12">
                <div className="flex justify-between items-end px-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t('revenueprogresswidget.monthly_liquidity_flow')}</p>
                    <div className="text-right">
                        <p className="font-black text-white text-3xl tracking-tighter italic">{formatVND(currentGMV)}</p>
                    </div>
                </div>

                <div className="h-6 bg-zinc-900/80 rounded-2xl w-full overflow-hidden border border-white/5 p-1 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 rounded-xl relative"
                    >
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white/20"
                        />
                    </motion.div>
                </div>

                <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1 pt-1">
                    <span>{t('revenueprogresswidget.baseline_0')}</span>
                    <span className="text-zinc-400">{t('revenueprogresswidget.target')}{formatVND(targetGMV)}</span>
                </div>
            </div>

            {/* Micro KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: DollarSign, value: formatVND(avgOrderValue), label: 'Avg Unit Order', color: 'text-amber-500' },
                    { icon: TrendingUp, value: ordersPerDay.toFixed(1), label: 'Daily Momentum', color: 'text-emerald-500' },
                    { icon: Users, value: activeDistributors, label: 'Verified Partners', color: 'text-blue-500' },
                ].map((kpi, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center backdrop-blur-md shadow-xl transition-colors hover:border-white/10"
                    >
                        <kpi.icon className={`w-6 h-6 ${kpi.color} mx-auto mb-3`} />
                        <p className="text-xl font-black text-white tracking-tighter italic">
                            {kpi.value}
                        </p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">
                            {kpi.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ARR Projections Stage */}
            <div className="mt-10 p-8 bg-zinc-900/60 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                    <TrendingUp className="text-emerald-500 w-24 h-24" />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t('revenueprogresswidget.annualized_run_rate_arr')}</span>
                        <p className="text-3xl font-black text-emerald-500 tracking-tighter italic">{formatVND(monthlyRunRate)}</p>
                    </div>
                    <div className="bg-[#00575A]/20 px-6 py-3 rounded-2xl border border-teal-500/20 backdrop-blur-xl">
                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">
                            {progress1M >= 100 ? '🎉 BENCHMARK ACHIEVED' :
                                `${((TARGET_1M - monthlyRunRate) / currentGMV * 30).toFixed(0)} DAYS TO $1M BENCHMARK`}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RevenueProgressWidget;
