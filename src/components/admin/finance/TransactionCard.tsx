import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ShieldAlert, Check, X, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '@/services/financeService';
import { formatVND } from '@/utils/format';
import { FraudBadge } from './FraudBadge';
import { useTranslation } from '@/hooks';

interface TransactionCardProps {
    transaction: Transaction;
    onApprove: () => void;
    onReject: () => void;
    loading?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onApprove, onReject, loading }) => {
    const { t } = useTranslation();
    const isHighRisk = transaction.fraudScore >= 70;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-zinc-950/50 backdrop-blur-3xl rounded-[2.5rem] p-8 border transition-all duration-500 group relative overflow-hidden ${isHighRisk
                ? 'border-rose-500/30 shadow-2xl shadow-rose-900/10'
                : 'border-white/5 hover:border-teal-500/20 shadow-2xl'
                }`}
        >
            {/* Background Kinetic Element */}
            <div className={`absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-125 transition-transform duration-[3s] ${transaction.type === 'revenue' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {transaction.type === 'revenue' ? <ArrowUpRight size={150} /> : <ArrowDownLeft size={150} />}
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${transaction.type === 'revenue'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-zinc-900 border-white/5 text-zinc-400'
                            }`}>
                            {transaction.type === 'revenue' ? <TrendingUp size={24} /> : <Wallet size={24} />}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-4 mb-1">
                                <h3 className="text-xl font-black text-white tracking-tight italic uppercase">
                                    {transaction.partnerName}
                                </h3>
                                <FraudBadge score={transaction.fraudScore} />
                            </div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                {t('transactioncard.uid')}{transaction.id.slice(0, 12)}{t('transactioncard.latency')}<span className="text-zinc-400">{t('transactioncard.optimal')}</span> • {transaction.timestamp}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end gap-8">
                        {transaction.type === 'payout' ? (
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{t('transactioncard.internal_ledger_net')}</p>
                                    <div className="text-3xl font-black text-white tracking-tighter italic">
                                        {formatVND(transaction.net || 0)}
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/5 mx-2" />
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-zinc-600">{t('transactioncard.gross')}{formatVND(transaction.gross || 0)}</div>
                                    <div className="text-[10px] font-bold text-rose-500/60 uppercase">{t('transactioncard.retention')}{formatVND(transaction.tax || 0)}</div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-2">{t('transactioncard.system_yield_injected')}</p>
                                <div className="text-4xl font-black text-emerald-400 tracking-tighter italic">
                                    +{formatVND(transaction.amount)}
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-[11px] font-medium text-zinc-400 italic bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit">
                                "{transaction.reason}"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 min-w-[240px]">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic border ${transaction.status === 'Approved' || transaction.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : transaction.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {transaction.status}
                        </span>
                    </div>

                    {transaction.status === 'Pending' && (
                        <div className="grid grid-cols-4 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onApprove}
                                disabled={loading}
                                className="col-span-3 h-14 bg-[#00575A] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#004447] transition-all disabled:opacity-50 flex items-center justify-center gap-3 italic shadow-xl shadow-teal-900/20 border border-white/10"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {t('transactioncard.commit_approval')}</motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onReject}
                                disabled={loading}
                                className="h-14 bg-zinc-900 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-white/5 flex items-center justify-center shadow-xl"
                            >
                                <X size={20} />
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>

            {isHighRisk && (
                <div className="mt-8 p-5 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] flex items-center gap-5">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                        <ShieldAlert className="text-rose-500" size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-rose-500 uppercase tracking-widest text-[10px] mb-1 italic">{t('transactioncard.security_engine_quarantine')}</p>
                        <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                            {t('transactioncard.flagged_for_behavioral_anomaly')}</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
