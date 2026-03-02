import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AuraBadge, AuraBadgeColor } from '../ui/Aura';

const COLOR_MAP: Record<string, { textLg: string; bg: string; border: string; text: string }> = {
    blue: { textLg: 'text-blue-500/50', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    emerald: { textLg: 'text-emerald-500/50', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    cyan: { textLg: 'text-cyan-500/50', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    violet: { textLg: 'text-violet-500/50', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
    pink: { textLg: 'text-pink-500/50', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
    purple: { textLg: 'text-purple-500/50', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    amber: { textLg: 'text-amber-500/50', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    rose: { textLg: 'text-rose-500/50', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    teal: { textLg: 'text-teal-500/50', bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400' },
    indigo: { textLg: 'text-indigo-500/50', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
};

interface AgentStatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: AuraBadgeColor;
    growth?: string;
}

export const AgentStatCard: React.FC<AgentStatCardProps> = ({ label, value, icon: Icon, color, growth }) => {
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl group relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-[3s] ${c.textLg}`}>
                <Icon size={120} />
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center border ${c.border} shadow-xl group-hover:rotate-12 transition-transform`}>
                    <Icon className={`w-7 h-7 ${c.text}`} />
                </div>
                {growth && <AuraBadge color={color}>{growth}</AuraBadge>}
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 italic">
                    {label}
                </p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter">
                    {value}
                </h3>
            </div>
        </motion.div>
    );
};
