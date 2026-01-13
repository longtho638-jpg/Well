import React from 'react';
import { motion } from 'framer-motion';
import { formatVND } from '@/utils/format';
import { LucideIcon } from 'lucide-react';

interface StatBoardProps {
    stats: {
        totalRevenue: number;
        totalPayout: number;
        pendingCount: number;
    };
    icons: {
        revenue: LucideIcon;
        payout: LucideIcon;
        pending: LucideIcon;
    };
}

export const StatBoard: React.FC<StatBoardProps> = ({ stats, icons }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
                {
                    label: 'Platform Net Revenue',
                    value: formatVND(stats.totalRevenue),
                    icon: icons.revenue,
                    color: 'emerald',
                    sub: 'Aggregated yield from distribution nodes'
                },
                {
                    label: 'Historical Payouts',
                    value: formatVND(stats.totalPayout),
                    icon: icons.payout,
                    color: 'rose',
                    sub: 'Total value distributed to network'
                },
                {
                    label: 'Ledger Audit Queue',
                    value: stats.pendingCount.toString(),
                    icon: icons.pending,
                    color: 'amber',
                    sub: 'Items awaiting financial verification'
                }
            ].map((stat, idx) => (
                <motion.div
                    key={idx}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group transition-all duration-500`}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <stat.icon size={100} />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 border border-${stat.color}-500/20 shadow-xl`}>
                                <stat.icon size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">{stat.label}</span>
                        </div>

                        <div>
                            <div className={`text-3xl font-black text-white tracking-tighter italic`}>
                                {stat.value}
                            </div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">{stat.sub}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
