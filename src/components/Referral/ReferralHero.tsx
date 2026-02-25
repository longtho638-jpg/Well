import React from 'react';
import { motion } from 'framer-motion';
import { Share2, TrendingUp } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface ReferralHeroProps {
    title: string;
    subtitle: string;
    description: string;
    totalBonus: number;
    monthlyReferrals: number;
}

export const ReferralHero: React.FC<ReferralHeroProps> = ({
    title,
    subtitle,
    description,
    totalBonus,
    monthlyReferrals
}) => {
    const { t } = useTranslation();
    
    return (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/10"
    >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

        <div className="relative p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-6">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl"
                        >
                            <Share2 className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-1">{title}</h1>
                            <p className="text-teal-100 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">{subtitle}</p>
                        </div>
                    </div>
                    <p className="text-white/80 dark:text-zinc-400 max-w-2xl text-lg font-medium leading-relaxed">
                        {description}
                    </p>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-zinc-950/50 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl min-w-[320px] text-center"
                >
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic">{t('referral.hero.accumulated_revenue')}</p>
                    <p className="text-5xl font-black text-white italic tracking-tighter mb-4">
                        {formatVND(totalBonus)}
                    </p>
                    <div className="inline-flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-full">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">+{monthlyReferrals} {t('referral.hero.this_month')}</span>
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
);
};
