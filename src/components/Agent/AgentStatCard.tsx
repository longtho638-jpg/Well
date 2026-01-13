import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AuraBadge, AuraBadgeColor } from '../ui/Aura';

interface AgentStatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: AuraBadgeColor;
    growth?: string;
}

export const AgentStatCard: React.FC<AgentStatCardProps> = ({ label, value, icon: Icon, color, growth }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl group relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-[3s] text-${color}-500/50`}>
                <Icon size={120} />
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 bg-${color}-500/10 rounded-2xl flex items-center justify-center border border-${color}-500/20 shadow-xl group-hover:rotate-12 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${color}-400`} />
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
