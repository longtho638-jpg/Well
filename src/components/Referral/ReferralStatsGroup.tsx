import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Gift } from 'lucide-react';

interface ReferralStatsGroupProps {
    totalReferrals: number;
    activeReferrals: number;
    conversionRate: number;
    monthlyReferrals: number;
    t: (key: string) => string;
}

export const ReferralStatsGroup: React.FC<ReferralStatsGroupProps> = ({
    totalReferrals,
    activeReferrals,
    conversionRate,
    monthlyReferrals,
    t
}) => {
    const stats = [
        {
            label: t('referral.stats.totalReferrals'),
            value: totalReferrals,
            sub: `${activeReferrals} ${t('referral.stats.active')}`,
            icon: Users,
            color: 'teal'
        },
        {
            label: t('referral.stats.conversionRate'),
            value: `${conversionRate}%`,
            sub: 'Optimized 🎯',
            icon: Target,
            color: 'amber'
        },
        {
            label: t('referral.stats.monthlyReferrals'),
            value: monthlyReferrals,
            sub: 'Growth Spike 🎉',
            icon: Gift,
            color: 'purple'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-all group"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl group-hover:scale-110 transition-transform">
                            <stat.icon className="w-7 h-7 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</p>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{stat.label}</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.sub}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
