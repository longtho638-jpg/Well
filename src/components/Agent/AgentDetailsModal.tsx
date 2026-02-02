import React from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Target, BookOpen, Activity } from 'lucide-react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { useTranslation } from '@/hooks';

interface AgentDetailsModalProps {
    agentName: string;
    onClose: () => void;
    getKPIs: (agentName: string) => { name: string; target: number; current?: number; unit: string }[];
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ agentName, onClose, getKPIs }) => {
    const { t } = useTranslation();
    const { getAgent } = useAgentOS();
    const agent = getAgent(agentName);
    const kpis = getKPIs(agentName);

    if (!agent) return null;
    const def = agent.getDefinition();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-950 rounded-[3rem] border border-white/5 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5 shadow-xl hover:scale-110"
                >
                    <X size={20} />
                </button>

                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <Activity className="text-teal-500 w-5 h-5 animate-pulse" />
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] italic">{t('agentdetailsmodal.intelligence_node_context')}</span>
                    </div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">{def.agent_name}</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2 border-l-2 border-teal-500 pl-4">
                        {def.business_function}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-12">
                        <ModalSection title={t('agentDashboard.strategic_objectives')} icon={Target}>
                            <ul className="space-y-4">
                                {def.primary_objectives.map((obj, i) => (
                                    <li key={i} className="flex gap-4 group/item">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                        <p className="text-[11px] font-bold text-zinc-400 uppercase leading-relaxed group-hover/item:text-zinc-200 transition-colors">{obj}</p>
                                    </li>
                                ))}
                            </ul>
                        </ModalSection>

                        <ModalSection title={t('agentDashboard.operational_policies')} icon={Shield}>
                            <div className="space-y-4">
                                {def.policy_and_constraints.map((policy, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border ${policy.enforcement === 'hard' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block ${policy.enforcement === 'hard' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {policy.enforcement} {t('agentdetailsmodal.enforcement')}</span>
                                        <p className="text-[10px] font-black text-white uppercase tracking-wider italic">{policy.rule}</p>
                                    </div>
                                ))}
                            </div>
                        </ModalSection>
                    </div>

                    <div className="space-y-12">
                        <ModalSection title={t('agentDashboard.operational_telemetry')} icon={Activity}>
                            <div className="space-y-6">
                                {kpis.map((kpi, i) => (
                                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 group/kpi">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/kpi:text-teal-400 transition-colors italic">{kpi.name}</span>
                                            <span className="text-xs font-black text-white font-mono italic">
                                                {kpi.current || 0} / {kpi.target} {kpi.unit}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((kpi.current || 0) / kpi.target) * 100}%` }}
                                                className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ModalSection>

                        <ModalSection title={t('agentDashboard.inputs_data_streams')} icon={BookOpen}>
                            <div className="flex flex-wrap gap-2">
                                {def.inputs.map((input, i) => (
                                    <span key={i} className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black text-zinc-500 uppercase tracking-widest italic group hover:text-white hover:border-white/10 transition-all">
                                        {input.source} // {input.dataType}
                                    </span>
                                ))}
                            </div>
                        </ModalSection>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ModalSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 shadow-xl">
                <Icon className="w-5 h-5 text-zinc-400 italic" />
            </div>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">{title}</h3>
        </div>
        {children}
    </div>
);
