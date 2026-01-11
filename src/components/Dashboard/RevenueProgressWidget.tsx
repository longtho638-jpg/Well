import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, DollarSign, Users, ArrowUpRight } from 'lucide-react';
import { formatVND } from '@/utils/format';

interface RevenueProgressProps {
    currentGMV: number;
    targetGMV: number;
    currentOrders: number;
    activeDistributors: number;
}

/**
 * RevenueProgressWidget - Founder-facing $1M revenue tracker
 * Displays GMV progress toward annual revenue goal
 */
export const RevenueProgressWidget: React.FC<RevenueProgressProps> = ({
    currentGMV,
    targetGMV,
    currentOrders,
    activeDistributors,
}) => {
    // Calculate metrics
    const progressPercent = Math.min((currentGMV / targetGMV) * 100, 100);
    const avgOrderValue = currentOrders > 0 ? currentGMV / currentOrders : 0;
    const monthlyRunRate = currentGMV * 12; // Annualized
    const ordersPerDay = currentOrders / 30; // Assuming 30-day period

    // $1M target calculation
    const TARGET_1M = 1000000 * 25000; // $1M in VND
    const progress1M = Math.min((monthlyRunRate / TARGET_1M) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            Revenue Progress
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Path to $1M ARR
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-xs font-bold">{progress1M.toFixed(1)}%</span>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-600 dark:text-zinc-400">Monthly GMV</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatVND(currentGMV)}
                    </span>
                </div>
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full relative"
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                </div>
                <div className="flex justify-between text-xs mt-1 text-zinc-500 dark:text-zinc-400">
                    <span>0đ</span>
                    <span>Target: {formatVND(targetGMV)}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {formatVND(avgOrderValue)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                        Avg Order
                    </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {ordersPerDay.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                        Orders/Day
                    </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {activeDistributors}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                        Distributors
                    </p>
                </div>
            </div>

            {/* $1M Projection */}
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-xl border border-emerald-500/20">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Annualized Run Rate
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatVND(monthlyRunRate)}
                    </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {progress1M >= 100 ? '🎉 $1M target achieved!' :
                        `${((TARGET_1M - monthlyRunRate) / currentGMV * 30).toFixed(0)} days to $1M at current pace`}
                </p>
            </div>
        </motion.div>
    );
};

export default RevenueProgressWidget;
