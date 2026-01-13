import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, ShieldCheck, User } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { RANK_NAMES } from '@/types';
import { Partner } from '@/hooks/usePartners';

interface PartnerRowProps {
    partner: Partner;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onView: (partner: Partner) => void;
}

export const PartnerRow = memo(({
    partner,
    isSelected,
    onToggle,
    onView
}: PartnerRowProps) => (
    <motion.tr
        layout
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
        className={`group border-b border-white/5 transition-all duration-300 ${isSelected ? 'bg-teal-500/5' : ''}`}
    >
        <td className="px-6 py-6">
            <button
                onClick={() => onToggle(partner.id)}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-500 scale-90 group-hover:scale-100 ${isSelected
                    ? 'bg-teal-500 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                    : 'border-white/10 hover:border-teal-500/50'
                    }`}
            >
                {isSelected && <Check className="w-4 h-4 text-white" />}
            </button>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-4">
                <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 text-zinc-600 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all shadow-xl"
                >
                    <User size={20} />
                </motion.div>
                <div>
                    <p className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-teal-400 transition-colors">{partner.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">{partner.email}</p>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-400 border border-white/5 italic group-hover:border-zinc-700 transition-colors">
                {RANK_NAMES[partner.rank] || 'Recruit'}
            </span>
        </td>
        <td className="px-6 py-4">
            <motion.div
                whileHover={{ x: 2 }}
                className="text-sm font-black text-emerald-500 italic tracking-tighter"
            >
                {formatVND(partner.totalSales)}
            </motion.div>
        </td>
        <td className="px-6 py-4">
            <motion.div
                whileHover={{ x: 2 }}
                className="text-sm font-black text-amber-500/80 italic tracking-tighter"
            >
                {formatVND(partner.pendingCashback)}
            </motion.div>
        </td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,1)]" />
                <span className="text-sm font-mono font-bold text-zinc-300 tabular-nums">{partner.pointBalance.toLocaleString()}</span>
            </div>
        </td>
        <td className="px-6 py-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit group-hover:scale-105 transition-transform ${partner.status === 'Active'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/5 border-rose-500/20 text-rose-500'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${partner.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{partner.status}</span>
            </div>
        </td>
        <td className="px-6 py-4">
            <motion.button
                whileHover={{ scale: 1.1, x: 5, backgroundColor: 'rgba(20, 184, 166, 0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onView(partner)}
                className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:border-teal-500/50 transition-all shadow-xl"
            >
                <Eye size={18} />
            </motion.button>
        </td>
    </motion.tr>
));
