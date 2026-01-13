import React from 'react';
import { motion } from 'framer-motion';
import { Network, Award, Zap, CheckCircle, UserPlus, Clock, XCircle } from 'lucide-react';
import { Referral } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface ReferralNetworkViewProps {
    f1Referrals: Referral[];
    f2Referrals: Referral[];
}

export const ReferralNetworkView: React.FC<ReferralNetworkViewProps> = ({ f1Referrals, f2Referrals }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-12">
            <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center">
                        <Network className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('referralnetworkview.network_architecture')}</h3>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{t('referralnetworkview.tier_1_tier_2_visualization')}</p>
                    </div>
                </div>

                {/* F1 Level */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <Award className="w-6 h-6 text-teal-500" />
                        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">{t('referralnetworkview.f1_sentinel_nodes')}</h4>
                        <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {f1Referrals.length} {t('referralnetworkview.nodes')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {f1Referrals.map((referral, index) => (
                            <ReferralNodeCard key={referral.id} referral={referral} index={index} level="F1" />
                        ))}
                    </div>
                </div>

                {/* F2 Level */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <Zap className="w-6 h-6 text-amber-500" />
                        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">{t('referralnetworkview.f2_secondary_propagation')}</h4>
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {f2Referrals.length} {t('referralnetworkview.nodes_1')}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {f2Referrals.map((referral, index) => (
                            <ReferralNodeCard key={referral.id} referral={referral} index={index} level="F2" isCompact />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReferralNodeCard = ({ referral, index, level, isCompact = false }: { referral: Referral; index: number; level: string; isCompact?: boolean }) => {
    const { t } = useTranslation();
    const getStatusTheme = (status: Referral['status']) => {
        switch (status) {
            case 'active': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active Sync' };
            case 'registered': return { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Identity Auth' };
            case 'pending': return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Awaiting Handshake' };
            case 'expired': return { icon: XCircle, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', label: 'Link Severed' };
            default: return { icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-white/5', label: 'Unknown' };
        }
    };

    const theme = getStatusTheme(referral.status);
    const StatusIcon = theme.icon;

    if (isCompact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-zinc-950 border border-white/5 p-4 rounded-2xl group hover:border-amber-500/30 transition-all text-center"
            >
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-black text-lg mx-auto mb-3 shadow-xl group-hover:scale-110 transition-transform">
                    {referral.referredName?.charAt(0) || '?'}
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-wider truncate mb-2">{referral.referredName || 'Unit-X'}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${theme.bg} ${theme.color} border ${theme.border}`}>
                    {theme.label}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
            className="bg-zinc-950 border border-white/5 p-6 rounded-[2rem] group hover:border-teal-500/30 transition-all shadow-xl"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-zinc-950 font-black text-2xl shadow-xl group-hover:rotate-6 transition-transform">
                        {referral.referredName?.charAt(0) || '?'}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-white italic tracking-tighter truncate">{referral.referredName || 'Unit-X'}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate">{referral.referredEmail}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className={`p-3 rounded-xl flex items-center justify-between ${theme.bg} border ${theme.border}`}>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.color}`}>{theme.label}</span>
                    <StatusIcon size={14} className={theme.color} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">{t('referralnetworkview.node_val')}</p>
                        <p className="text-sm font-black text-white tabular-nums">{referral.totalRevenue > 0 ? formatVND(referral.totalRevenue) : '-'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">{t('referralnetworkview.yield')}</p>
                        <p className="text-sm font-black text-emerald-400 tabular-nums">{referral.referralBonus > 0 ? formatVND(referral.referralBonus) : '-'}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
