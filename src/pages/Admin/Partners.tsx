/**
 * WellNexus Partner CRM (Bee 3.0 Elite)
 * High-performance reconnaissance dashboard for ecosystem management.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, RefreshCw, TrendingUp } from 'lucide-react';

// Hooks & Types
import { usePartners, Partner } from '@/hooks/usePartners';

// Aura Elite Sub-components
import { PartnerFilters } from '@/components/admin/partners/PartnerFilters';
import { PartnersTable } from '@/components/admin/partners/PartnersTable';
import { BulkActionsBar } from '@/components/admin/partners/BulkActionsBar';
import { PartnerDetailModal } from '@/components/admin/partners/PartnerDetailModal';

const Partners: React.FC = () => {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    selectedIds,
    setSelectedIds,
    bulkActionLoading,
    fetchPartners,
    filteredPartners,
    toggleSelect,
    toggleSelectAll,
    handleBulkAction,
    updatePartner
  } = usePartners();

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  /**
   * Strategic Node Data Commitment
   */
  const handlePartnerUpdate = async (id: string, updates: Partial<Partner>) => {
    await updatePartner(id, updates);
    setSelectedPartner(null);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Mission Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFBF00] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,191,0,0.3)]">
              <Zap className="text-zinc-950 w-7 h-7" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Partner Recon CRM</h2>
          </div>
          <p className="text-zinc-500 font-medium text-lg max-w-2xl leading-relaxed">
            Precision orchestration of network nodes, financial balances, and ecosystem <span className="text-[#FFBF00] font-bold uppercase italic">Rank Intelligence</span>.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPartners}
            disabled={loading}
            className="p-5 bg-zinc-900 border border-white/5 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all text-zinc-500 disabled:opacity-50"
          >
            <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </motion.div>

      {/* Ecosystem Intelligence Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Ecosystem Nodes', value: filteredPartners.length, icon: Shield, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { label: 'Active Bee Force', value: filteredPartners.filter(p => p.status === 'Active').length, icon: Zap, color: 'text-[#FFBF00]', bg: 'bg-[#FFBF00]/10' },
          { label: 'Ecosystem Growth', value: '+12.5%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2rem] group hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 ${stat.color}`}>
              <stat.icon size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-current/20`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Strategic Recon Filters */}
      <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <PartnerFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          loading={loading}
          onRefresh={fetchPartners}
        />
      </div>

      {/* Bulk Operation Hub */}
      <AnimatePresence mode="popLayout">
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="sticky top-10 z-50 py-4"
          >
            <BulkActionsBar
              selectedCount={selectedIds.size}
              loading={bulkActionLoading}
              onAction={handleBulkAction}
              onClear={handleClearSelection}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Fidelity Ledger View */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-[2.6rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
        <PartnersTable
          partners={filteredPartners}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onView={setSelectedPartner}
        />
      </div>

      {/* Detail Investigation Focal Point */}
      <AnimatePresence mode="wait">
        {selectedPartner && (
          <PartnerDetailModal
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
            onUpdate={handlePartnerUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Partners;
