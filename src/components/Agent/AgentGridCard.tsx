import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentDefinition, AgentKPI } from '@/types/agentic';
import { Zap, Target, Activity } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface AgentGridCardProps {
    agent: AgentDefinition;
    isSelected: boolean;
    onClick: () => void;
    getKPIs: (agentName: string) => AgentKPI[];
}

export const AgentGridCard: React.FC<AgentGridCardProps> = ({ agent, isSelected, onClick, getKPIs }) => {
    const { t } = useTranslation();
    const kpis = getKPIs(agent.agent_name);
    const isActive = agent.agent_name === 'The Bee' || agent.agent_name === 'Project Manager';

    // Fake Training Progress for Aura effect
    const trainingProgress = useMemo(() => Math.floor(Math.random() * 30) + 60, []);

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative p-6 rounded-[2.5rem] border cursor-pointer transition-all duration-500 overflow-hidden group
                ${isSelected
                    ? 'bg-zinc-900 border-teal-500/50 shadow-2xl shadow-teal-500/10'
                    : 'bg-zinc-950/50 border-white/5 hover:border-white/20'
                }
            `}
        >
            {/* Background Kinetic Layer */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent animate-pulse pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="space-y-1">
                    <h3 className="font-black text-xs text-white uppercase italic tracking-widest flex items-center gap-2">
                        {agent.agent_name}
                        {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                        )}
                    </h3>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest opacity-80 italic">
                        {t('agentgridcard.node_id')}{agent.agent_name.toUpperCase().replace(/\s+/g, '_')}{t('agentgridcard.0x')}</p>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest italic
                    ${isActive
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}
                >
                    {isActive ? 'Active Node' : 'Training'}
                </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-bold leading-relaxed mb-8 line-clamp-2 h-8 uppercase tracking-tight">
                {agent.primary_objectives[0]}
            </p>

            <div className="relative z-10">
                {isActive ? (
                    kpis.length > 0 ? (
                        <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest italic flex items-center gap-2">
                                    <Target size={12} /> {kpis[0].name}
                                </span>
                                <span className="text-[10px] font-black text-white font-mono">
                                    {(kpis[0].current || 0).toString().padStart(3, '0')} / {kpis[0].target}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-zinc-600">
                            <Activity size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{t('agentgridcard.telemetry_stream_active')}</span>
                        </div>
                    )
                ) : (
                    <div className="space-y-3 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-400/70 italic">
                            <span className="flex items-center gap-2"><Zap size={12} className="animate-pulse" /> {t('agentgridcard.neural_training')}</span>
                            <span>{trainingProgress}%</span>
                        </div>
                        <div className="h-1 w-full bg-indigo-900/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${trainingProgress}%` }}
                                className="h-full bg-indigo-500/50 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12" />
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
