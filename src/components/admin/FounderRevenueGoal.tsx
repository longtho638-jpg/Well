/**
 * Founder Revenue Goal Widget
 * Target: $1,000,000 USD in 2026
 * 
 * Features:
 * - Progress tracking with visual bar
 * - Monthly breakdown
 * - Pace indicator (on track / behind / ahead)
 * - AI-powered recommendations
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    TrendingUp,
    TrendingDown,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Rocket,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    useFounderRevenueGoalProgressCalculator,
    CURRENT_REVENUE_USD,
    CURRENT_REVENUE_VND,
    GOAL_USD,
} from './use-founder-revenue-goal-progress-calculator';
import { FounderProgressRing } from './founder-revenue-goal-progress-ring-svg';

const PriorityBadge: React.FC<{ priority: string; t: (key: string) => string }> = ({ priority, t }) => {
    const config = {
        high: 'bg-red-500/10 text-red-400 border-red-500/20',
        medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    const labelMap: Record<string, string> = {
        high: t('common.priority.high'),
        medium: t('common.priority.medium'),
        low: t('common.priority.low'),
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${config[priority as keyof typeof config]}`}>
            {labelMap[priority] ?? priority}
        </span>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function FounderRevenueGoal() {
    const { t } = useTranslation();
    const { progressPercentage, paceStatus, milestones, recommendations } = useFounderRevenueGoalProgressCalculator();

    return (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">{t('founderrevenuegoal.m_c_ti_u_2026')}</h2>
                        <p className="text-sm text-emerald-400 font-medium">{t('founderrevenuegoal.1_000_000_usd')}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${paceStatus === 'ahead'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                    {paceStatus === 'ahead' ? (
                        <>
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('founderrevenuegoal.v_t_ti_n')}</span>
                        </>
                    ) : (
                        <>
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('founderrevenuegoal.c_n_t_ng_t_c')}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <div className="flex items-center gap-8 mb-6">
                <FounderProgressRing percentage={progressPercentage} />

                <div className="flex-1 space-y-4">
                    <div>
                        <p className="text-sm text-zinc-500 mb-1">{t('founderrevenuegoal.doanh_thu_hi_n_t_i')}</p>
                        <p className="text-3xl font-bold text-zinc-100">
                            ${CURRENT_REVENUE_USD.toLocaleString('en-US')}
                        </p>
                        <p className="text-sm text-zinc-500">
                            ≈ {CURRENT_REVENUE_VND.toLocaleString('vi-VN')} đ
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                        <span className="text-sm text-zinc-400">${GOAL_USD.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {milestones.map(({ milestone, quarter, reached }) => (
                    <div
                        key={milestone}
                        className={`p-3 rounded-lg border ${reached
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-zinc-800/50 border-zinc-700'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {reached ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Target className="w-4 h-4 text-zinc-500" />
                            )}
                            <span className={`text-sm font-medium ${reached ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                {quarter}
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${reached ? 'text-emerald-300' : 'text-zinc-300'}`}>
                            ${(milestone / 1000).toFixed(0)}K
                        </p>
                    </div>
                ))}
            </div>

            {/* AI Recommendations */}
            <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-medium text-zinc-300">{t('founderrevenuegoal.ai_xu_t_h_nh_ng')}</h3>
                </div>
                <div className="space-y-2">
                    {recommendations.map((rec, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <Rocket className="w-4 h-4 text-zinc-400" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-100">{rec.title}</p>
                                        <PriorityBadge priority={rec.priority} t={t} />
                                    </div>
                                    <p className="text-xs text-zinc-500">{rec.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-emerald-400">{rec.impact}</span>
                                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FounderRevenueGoal;
