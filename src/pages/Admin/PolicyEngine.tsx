import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  RefreshCw,
  Cpu,
  Database,
  Lock
} from 'lucide-react';

// Hooks & Services
import { usePolicyEngine } from '@/hooks/usePolicyEngine';

// Sub-components
import { CommissionSection } from '@/components/admin/policy/CommissionSection';
import { BeeAutomationSection } from '@/components/admin/policy/BeeAutomationSection';
import { RankLadderSection } from '@/components/admin/policy/RankLadderSection';
import { SimulationPanel } from '@/components/admin/policy/SimulationPanel';

// Shared
import { AuraBadge } from '@/components/ui/Aura';
import { useTranslation } from '@/hooks';

const PolicyEngine: React.FC = () => {
    const { t } = useTranslation();
  const {
    loading,
    saving,
    lastSaved,
    commissions,
    beeAgent,
    rankUpgrades,
    updateRankUpgrade,
    simulation,
    handleSave
  } = usePolicyEngine();

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      // toast.success('✅ Policy Configuration Saved Successfully!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4 bg-zinc-950">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic animate-pulse">{t('policyEngine.synchronizingPolicyCore')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto px-6">
      {/* Sentinel Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-12"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-[#FFBF00] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,191,0,0.3)] relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Cpu className="text-zinc-950 w-8 h-8 relative z-10" />
            </div>
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
                {t('policyEngine.title')}<span className="text-zinc-700">{t('policyEngine.version')}</span>
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">{t('policyEngine.strategicIntegrityConfirmed')}</span>
                </div>
                {lastSaved && (
                  <>
                    <span className="text-zinc-800">/</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic flex items-center gap-2">
                      <Database size={12} /> {t('policyEngine.sync')}{lastSaved}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-4 bg-[#FFBF00] text-zinc-950 px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-[#FFD700] transition-all shadow-[0_20px_40px_rgba(255,191,0,0.2)] disabled:opacity-50 italic text-xs group"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Lock size={18} className="group-hover:rotate-12 transition-transform" />}
          {saving ? 'Committing...' : 'Commit Configuration'}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Intelligence Column */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CommissionSection commissions={commissions} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BeeAutomationSection beeAgent={beeAgent} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RankLadderSection rankUpgrades={rankUpgrades} updateRankUpgrade={updateRankUpgrade} />
          </motion.div>
        </div>

        {/* Projection Column */}
        <div className="lg:col-span-12 xl:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky top-10 space-y-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">{t('policyEngine.projectionSimulator')}</h3>
              <AuraBadge color="amber">{t('policyEngine.realTime')}</AuraBadge>
            </div>
            <SimulationPanel simulation={simulation} />

            <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 space-y-6 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-[4s]">
                <ShieldCheck size={120} />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest italic leading-relaxed">
                  {t('policyEngine.policyChangesAreCryptographicallySigned')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEngine;
