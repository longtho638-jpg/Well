import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useTranslation } from '@/hooks';

export const ReferralRewardsList: React.FC = () => {
    const { t } = useTranslation();
    const rewards = [
        {
            title: 'Activation Milestone',
            desc: 'Instant liquidity on successful identity sync',
            value: '+50K',
            sub: 'per node',
            icon: '🎁',
            color: 'from-emerald-400 to-emerald-600'
        },
        {
            title: 'Revenue Override',
            desc: 'Secondary yield on ecosystem commerce',
            value: '+10%',
            sub: 'override',
            icon: '💰',
            color: 'from-blue-400 to-blue-600'
        },
        {
            title: 'Expansion Bonus',
            desc: 'Achieved at 10 active sentinel nodes',
            value: '+1M',
            sub: 'one-time',
            icon: '🏆',
            color: 'from-amber-400 to-amber-600'
        }
    ];

    return (
        <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-6 mb-10">
                <div className="w-12 h-12 bg-white text-zinc-950 rounded-2xl flex items-center justify-center">
                    <Gift size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('referralrewardslist.yield_mechanics')}</h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{t('referralrewardslist.incentive_algorithm')}</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {rewards.map((reward, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ x: 10 }}
                        className="bg-zinc-950 border border-white/5 p-6 rounded-[2rem] group hover:border-white/20 transition-all flex items-center gap-6"
                    >
                        <div className={`w-16 h-16 bg-gradient-to-br ${reward.color} rounded-2xl flex items-center justify-center text-3xl shadow-2xl group-hover:rotate-12 transition-transform`}>
                            {reward.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">{reward.title}</h4>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{reward.desc}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white font-mono">{reward.value}</p>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{reward.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
