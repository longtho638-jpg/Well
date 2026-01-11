/**
 * Team Metrics Cards Component
 * Displays 4 key team metrics in a grid
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Target, Award, Activity } from 'lucide-react';
import { TeamMetrics } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface TeamMetricsCardsProps {
    metrics: TeamMetrics;
}

interface MetricCardProps {
    icon: React.ReactNode;
    iconColor: string;
    glowColor: string;
    value: string | number;
    label: string;
    badge?: React.ReactNode;
    delay: number;
}

function MetricCard({ icon, iconColor, glowColor, value, label, badge, delay }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="relative group"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 hover:border-${iconColor.split('-')[1]}-500/30 transition-all`}>
                <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 ${iconColor}`}>{icon}</div>
                    {badge}
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm text-zinc-400">{label}</p>
            </div>
        </motion.div>
    );
}

export function TeamMetricsCards({ metrics }: TeamMetricsCardsProps) {
    const { t } = useTranslation();

    return (
        <div className="grid md:grid-cols-4 gap-4">
            <MetricCard
                icon={<Users className="w-8 h-8" />}
                iconColor="text-blue-400"
                glowColor="from-blue-500/10 to-blue-600/10"
                value={metrics.totalMembers}
                label={t('team.metrics.totalMembers')}
                badge={
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                        {metrics.activeMembers}/{metrics.totalMembers} {t('team.metrics.active')}
                    </span>
                }
                delay={0.3}
            />

            <MetricCard
                icon={<DollarSign className="w-8 h-8" />}
                iconColor="text-emerald-400"
                glowColor="from-emerald-500/10 to-emerald-600/10"
                value={formatVND(metrics.totalTeamVolume)}
                label={t('team.metrics.teamVolume')}
                badge={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                delay={0.4}
            />

            <MetricCard
                icon={<Target className="w-8 h-8" />}
                iconColor="text-purple-400"
                glowColor="from-purple-500/10 to-purple-600/10"
                value={formatVND(metrics.averageSalesPerMember)}
                label={t('team.metrics.averageSales')}
                badge={
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20">
                        +{metrics.monthlyGrowth}%
                    </span>
                }
                delay={0.5}
            />

            <MetricCard
                icon={<Award className="w-8 h-8" />}
                iconColor="text-orange-400"
                glowColor="from-orange-500/10 to-orange-600/10"
                value={metrics.topPerformers.length}
                label={t('team.metrics.topPerformers')}
                badge={<Activity className="w-5 h-5 text-orange-400" />}
                delay={0.6}
            />
        </div>
    );
}
