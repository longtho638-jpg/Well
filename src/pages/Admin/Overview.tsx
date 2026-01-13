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
  TrendingUp,
  Clock,
  Check,
  X,
  UserCheck,
  Wallet,
  Zap,
  RefreshCw,
  ChevronRight,
  Search,
  Mail,
  Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Hooks & Utils
import { useAdminOverview, AIAction } from '@/hooks/useAdminOverview';
import { formatVND } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// SUB-COMPONENTS
// ============================================================

const MetricCard: React.FC<{ label: string; value: string; trend: string; icon: React.ElementType; color: string }> = ({ label, value, trend, icon: Icon, color }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
      <Icon size={120} />
    </div>
    <div className="relative z-10 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl border ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</p>
        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={12} />
          {trend}
        </div>
      </div>
    </div>
  </div>
);

const AIActionItem: React.FC<{ action: AIAction; onAction: (id: string, decision: 'approve' | 'reject') => void }> = ({ action, onAction }) => {
  const icons = {
    kyc: UserCheck,
    withdrawal: Wallet,
    fraud: ShieldAlert,
    policy: Activity
  };
  const Icon = icons[action.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 rounded-3xl group hover:border-[#00575A]/30 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-2xl ${action.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-[#00575A]/10 text-[#00575A] border-[#00575A]/20'} border`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{action.title}</h4>
              <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> {action.timestamp}</p>
            </div>
            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${action.priority === 'high' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
              {action.priority} Risk
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">"{action.description}"</p>

          {/* Confidence Meter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${action.aiConfidence}%` }} className="h-full bg-[#00575A]" />
            </div>
            <span className="text-[10px] font-black text-[#00575A] uppercase tracking-tighter">AI: {action.aiConfidence}% Confident</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => onAction(action.id, 'approve')} className="flex-1 bg-[#00575A] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-all">Resolve</button>
            <button onClick={() => onAction(action.id, 'reject')} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 dark:border-white/5">Reject</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const Overview: React.FC = () => {
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
          <h2 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">Mission Control</h2>
          <p className="text-zinc-500 font-medium text-lg">Autonomous ecosystem orchestration & real-time telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-6 py-4 rounded-2xl border border-emerald-500/20">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Ecosystem Online</span>
          </div>
        </div>
      </div>

      {/* Strategic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Global GMV" value={formatVND(metrics.totalRevenue)} trend="+18.4% WoW" icon={Activity} color="bg-blue-500/10 text-blue-500 border-blue-500/20" />
        <MetricCard label="Active Bee Force" value={metrics.activePartners.toString()} trend="+12 New nodes" icon={Users} color="bg-indigo-500/10 text-indigo-500 border-indigo-500/20" />
        <MetricCard label="AI Signal Pending" value={aiActions.length.toString()} trend="Action required" icon={Bot} color="bg-rose-500/10 text-rose-500 border-rose-500/20" />
        <MetricCard label="Ecosystem SLA" value={`${metrics.systemHealth}%`} trend="Operational" icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" />
      </div>

      {/* Main Orchestration Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* AI Decision Center */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#00575A]" size={20} />
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">AI Action Center</h3>
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Autonomous Recommendations</span>
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
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Queue Exhausted</h4>
                    <p className="text-zinc-500 font-medium">AI Agent has autonomously resolved all prioritized tasks.</p>
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
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">Live Pulse</h3>
          </div>

          <div className="bg-zinc-900 text-white p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={80} />
            </div>

            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Growth trajectory</p>
              <h4 className="text-2xl font-black tracking-tighter uppercase italic">Ecosystem scale</h4>
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
                  <Area type="monotone" dataKey="revenue" stroke="#2DD4BF" strokeWidth={4} fill="url(#glow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4 relative z-10 pt-4 border-t border-white/5">
              {[
                { m: 'AI scan completed: 245 profiles', t: '12s ago', i: Bot },
                { m: 'Policy: Retail Comm locked at 25%', t: '2m ago', i: Settings },
                { m: 'Security: Zero fraud packets detected', t: '5m ago', i: ShieldAlert },
              ].map((evt, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-emerald-400 transition-colors"><evt.i size={14} /></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors leading-tight">{evt.m}</p>
                    <p className="text-[9px] font-black text-zinc-600 uppercase mt-1">{evt.t}</p>
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
