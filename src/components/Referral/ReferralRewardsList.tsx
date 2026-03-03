import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, Trophy } from 'lucide-react';
import { useTranslation } from '@/hooks';

export const ReferralRewardsList: React.FC = () => {
    const { t } = useTranslation();
    const rewards = [
        {
            title: t('referral.rewards.activation.title'),
            desc: t('referral.rewards.activation.desc'),
            value: '+50K',
            sub: t('referral.rewards.activation.sub'),
            icon: <Gift className="w-8 h-8" />,
            color: 'from-emerald-400 to-emerald-600'
        },
        {
            title: t('referral.rewards.revenue.title'),
            desc: t('referral.rewards.revenue.desc'),
            value: '+10%',
            sub: t('referral.rewards.revenue.sub'),
            icon: <Coins className="w-8 h-8" />,
            color: 'from-blue-400 to-blue-600'
        },
        {
            title: t('referral.rewards.expansion.title'),
            desc: t('referral.rewards.expansion.desc'),
            value: '+1M',
            sub: t('referral.rewards.expansion.sub'),
            icon: <Trophy className="w-8 h-8" />,
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
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('referral.rewards.yield_mechanics')}</h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{t('referral.rewards.incentive_algorithm')}</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {rewards.map((reward, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ x: 10 }}
                        className="bg-zinc-950 border border-white/5 p-6 rounded-[2rem] group hover:border-white/20 transition-all flex items-center gap-6"
                    >
                        <div className={`w-16 h-16 bg-gradient-to-br ${reward.color} rounded-2xl flex items-center justify-center text-3xl shadow-2xl group-hover:rotate-12 transition-transform text-white`}>
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
