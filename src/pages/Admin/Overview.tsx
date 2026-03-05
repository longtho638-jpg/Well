/**
 * Admin Mission Control - Overview (Refactored)
 * Phase 4: AI-driven autonomous operations dashboard with "Aura" aesthetics.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  CheckCircle2,
  Bot,
  Sparkles,
  ShieldAlert,
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react';
import { AreaChart } from 'recharts';
import { Area } from 'recharts';
import { ResponsiveContainer } from 'recharts';

// Hooks & Utils
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { formatVND } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/hooks';
import { MetricCard } from './overview-animated-metric-cards';
import { AIActionItem } from './overview-ai-action-item';

// ============================================================
// MAIN PAGE
// ============================================================

const Overview: React.FC = () => {
    const { t } = useTranslation();
  const { metrics, aiActions, loading, growthData, refresh, handleAction } = useAdminOverview();
  const { showToast } = useToast();

  const onDecision = (id: string, decision: 'approve' | 'reject') => {
    handleAction(id, decision);
    showToast(decision === 'approve' ? 'Action resolved by AI recommendation' : 'AI recommendation rejected', decision === 'approve' ? 'success' : 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 max-w-7xl mx-auto pb-24"
    >
      {/* Mission Control Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">{t('overview.mission_control')}</h2>
          <p className="text-zinc-500 font-medium text-lg">{t('overview.autonomous_ecosystem_orchestra')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} aria-label={t('common.refresh')} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-6 py-4 rounded-2xl border border-emerald-500/20">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{t('overview.ecosystem_online')}</span>
          </div>
        </div>
      </div>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label={t('overview.global_gmv')} value={formatVND(metrics.totalRevenue)} numericValue={metrics.totalRevenue} trend={t('overview.trend_wow')} icon={Activity} color="bg-blue-500/10 text-blue-500 border-blue-500/20" index={0} />
        <MetricCard label={t('overview.active_bee_force')} value={metrics.activePartners.toString()} numericValue={metrics.activePartners} trend={t('overview.trend_new_nodes')} icon={Users} color="bg-indigo-500/10 text-indigo-500 border-indigo-500/20" index={1} />
        <MetricCard label={t('overview.ai_signal_pending')} value={aiActions.length.toString()} numericValue={aiActions.length} trend={t('overview.trend_action_required')} icon={Bot} color="bg-rose-500/10 text-rose-500 border-rose-500/20" index={2} />
        <MetricCard label={t('overview.ecosystem_sla')} value={`${metrics.systemHealth}%`} numericValue={metrics.systemHealth} trend={t('overview.trend_operational')} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" index={3} />
      </div>

      {/* Main Orchestration Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* AI Decision Center */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#00575A]" size={20} />
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{t('overview.ai_action_center')}</h3>
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('overview.autonomous_recommendations')}</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {aiActions.length > 0 ? aiActions.map(action => (
                <AIActionItem key={action.id} action={action} onAction={onDecision} />
              )) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-16 rounded-[3rem] text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{t('overview.queue_exhausted')}</h4>
                    <p className="text-zinc-500 font-medium">{t('overview.ai_agent_has_autonomously_reso')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Telemetry & Pulse */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Zap className="text-[#00575A]" size={20} />
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">{t('overview.live_pulse')}</h3>
          </div>

          <div className="bg-zinc-900 text-white p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={80} />
            </div>

            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{t('overview.growth_trajectory')}</p>
              <h4 className="text-2xl font-black tracking-tighter uppercase italic">{t('overview.ecosystem_scale')}</h4>
            </div>

            <div className="h-48 relative z-10 -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00575A" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00575A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="#2DD4BF" strokeWidth={4} fill="url(#glow)" isAnimationActive={true} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 relative z-10 pt-4 border-t border-white/5">
              {[
                { m: t('overview.evt_ai_scan'), time: t('overview.evt_12s_ago'), i: Bot },
                { m: t('overview.evt_policy_locked'), time: t('overview.evt_2m_ago'), i: Settings },
                { m: t('overview.evt_zero_fraud'), time: t('overview.evt_5m_ago'), i: ShieldAlert },
              ].map((evt, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="p-3 bg-white/5 rounded-lg text-zinc-400 group-hover:text-emerald-400 transition-colors"><evt.i size={14} /></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight">{evt.m}</p>
                    <p className="text-[9px] font-black text-zinc-600 uppercase mt-1">{evt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Overview;
