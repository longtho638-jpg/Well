/**
 * WellNexus Agent Command Center (Aura Elite Edition)
 * Enterprise-grade agent orchestration with high-fidelity telemetry and kinetic UI.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Zap,
  BarChart3,
  Cpu,
  Terminal,
  ShieldCheck,
  Hexagon,
  Target,
  Users,
  Package
} from 'lucide-react';

// Hooks & Store
import { useAgentCenter } from '@/hooks/useAgentCenter';

// Shared Components
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import { LiveConsole } from '@/components/LiveConsole';
import { GridPattern, BentoGrid, AuraBadge } from '@/components/ui/Aura';

// Modular Components
import { AgentStatCard } from '@/components/Agent/AgentStatCard';
import { AgentGridCard } from '@/components/Agent/AgentGridCard';
import { AgentDetailsModal } from '@/components/Agent/AgentDetailsModal';
import { useTranslation } from '@/hooks';

export const AgentDashboard: React.FC = () => {
    
  const {
    groupedAgents,
    stats,
    selectedAgent,
    isLoading,
    isAdminView,
    userRole,
    handleAgentClick,
    closeDetails,
    toggleAdminView,
    getAgentKPIs,
    t
  } = useAgentCenter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic animate-pulse">{t('agentDashboard.establishingNodeSync')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden transition-colors duration-500 pb-20">
      <GridPattern />
      <ParticleBackground />
      <CursorGlow />

      <div className="relative z-10 px-6 lg:px-12 py-10 space-y-12 max-w-[1600px] mx-auto">
        {/* Tactical Command Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-white/5 pb-12"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <Hexagon className="w-9 h-9 text-zinc-950 relative z-10" />
              </motion.div>
              <div>
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                  {t('agentDashboard.title')}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">{t('agentDashboard.intelligenceGridOptimal')}</span>
                  </div>
                  <span className="text-zinc-800">/</span>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                    {t('agentDashboard.operationalTier')}{userRole.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {(userRole === 'Partner' || userRole === 'Admin') && (
              <button
                onClick={toggleAdminView}
                className={`px-8 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-[0.2em] transition-all italic flex items-center gap-3
                                    ${isAdminView
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'
                  }`}
              >
                <ShieldCheck size={16} />
                {isAdminView ? 'Full Clearance Active' : 'Elevate Privilege'}
              </button>
            )}
            <div className="h-10 w-px bg-white/5 mx-2 hidden xl:block" />
            <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 px-6 py-4 rounded-2xl">
              <Terminal size={16} className="text-teal-500" />
              <span className="text-xs font-black text-zinc-300 font-mono italic uppercase tracking-widest leading-none">{t('agentDashboard.version')}</span>
            </div>
          </div>
        </motion.div>

        {/* Surveillance & System Health Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <LiveConsole />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <AgentStatCard
              label="Autonomous Core Nodes"
              value={stats[0].value}
              icon={Hexagon}
              color="blue"
              growth={stats[0].growth}
            />
            <AgentStatCard
              label="Neural Functions Active"
              value={stats[1].value}
              icon={Zap}
              color="emerald"
              growth={stats[1].growth}
            />
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="space-y-12">
          {Object.entries(groupedAgents).map(([functionName, functionAgents], sectionIdx) => (
            <motion.section
              key={functionName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-6">
                <div className="h-0.5 w-12 bg-gradient-to-r from-teal-500 to-transparent" />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">
                  {functionName} {t('agentDashboard.registry')}</h3>
                <div className="flex-1 h-px bg-white/5" />
                <AuraBadge color="teal" className="opacity-50">
                  {functionAgents.length} {t('agentDashboard.nodes')}</AuraBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                {functionAgents.map((agent, agentIdx) => (
                  <AgentGridCard
                    key={agent.agent_name}
                    agent={agent}
                    isSelected={selectedAgent === agent.agent_name}
                    onClick={() => handleAgentClick(agent.agent_name)}
                    getKPIs={getAgentKPIs}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Strategic Simulation Hook (Placeholder link to Strategy) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-12 text-center relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.02] to-transparent" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl group-hover:rotate-12 transition-transform">
              <Target className="w-8 h-8 text-teal-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('agentDashboard.strategicSimulatorOffline')}</h3>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                {t('agentDashboard.connectToPolicyEngine')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agent Detail Portal */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailsModal
            agentName={selectedAgent}
            onClose={closeDetails}
            getKPIs={getAgentKPIs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentDashboard;
