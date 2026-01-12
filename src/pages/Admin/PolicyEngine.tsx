import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Save, DollarSign, Users, TrendingUp, Zap, Target, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';

/**
 * POLICY ENGINE v3.0 (BEE 3.0 CORE)
 * Bộ não chiến lược cho WellNexus Platform - Real-time Database Sync
 *
 * Features:
 * - 3-tier commission structure with dynamic sliders
 * - Real-time payout risk monitoring
 * - Game rules configuration
 * - Financial simulation engine
 * - 🆕 Database-backed configuration (no manual redeployment needed)
 */

interface PolicyConfig {
  commissions?: {
    retailComm?: number;
    agencyBonus?: number;
    elitePool?: number;
  };
  rules?: {
    activationThreshold?: number;
    whiteLabelGMV?: number;
    whiteLabelPartners?: number;
  };
  beeAgentPolicy?: {
    ctvCommission?: number;
    startupCommission?: number;
    sponsorBonus?: number;
    rankUpThreshold?: number;
  };
  rankUpgrades?: RankUpgrade[];
}

interface RankUpgrade {
  fromRank: number;
  toRank: number;
  name: string;
  conditions: {
    salesRequired?: number;
    teamVolumeRequired?: number;
    directDownlinesRequired?: number;
    minDownlineRank?: number;
  };
}

const PolicyEngine: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 1. Commission Config State (3 Tầng)
  const [retailComm, setRetailComm] = useState(25);
  const [agencyBonus, setAgencyBonus] = useState(10);
  const [elitePool, setElitePool] = useState(3);

  // 2. Game Rules State
  const [activationThreshold, setActivationThreshold] = useState(6000000);
  const [whiteLabelGMV, setWhiteLabelGMV] = useState(1000000000);
  const [whiteLabelPartners, setWhiteLabelPartners] = useState(50);

  // 3. Simulation State
  const [simPartners, setSimPartners] = useState(1000);
  const [simAOV, setSimAOV] = useState(1500000);
  const [fixedCost, setFixedCost] = useState(500000000); // 500tr chi phí vận hành

  // 🆕 4. The Bee Agent - Commission Tiers (NEW POLICY)
  const [ctvCommission, setCtvCommission] = useState(21); // CTV: 21%
  const [startupCommission, setStartupCommission] = useState(25); // STARTUP+: 25%
  const [sponsorBonus, setSponsorBonus] = useState(8); // AMBASSADOR+: 8%
  const [rankUpThreshold, setRankUpThreshold] = useState(9900000); // 9.9M VND to upgrade

  // 🆕 5. Admin 3.1: Dynamic Rank Upgrades
  const [rankUpgrades, setRankUpgrades] = useState<RankUpgrade[]>([]);

  // 🆕 Fetch policy from database on mount
  useEffect(() => {
    fetchPolicyConfig();
  }, []);

  const fetchPolicyConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_config')
        .select('value')
        .eq('key', 'global_policy')
        .single();

      if (error) throw error;

      if (data && data.value) {
        const config = data.value as PolicyConfig;
        // Load commission settings
        if (config.commissions) {
          setRetailComm(config.commissions.retailComm || 25);
          setAgencyBonus(config.commissions.agencyBonus || 10);
          setElitePool(config.commissions.elitePool || 3);
        }
        // Load rules
        if (config.rules) {
          setActivationThreshold(config.rules.activationThreshold || 6000000);
          setWhiteLabelGMV(config.rules.whiteLabelGMV || 1000000000);
          setWhiteLabelPartners(config.rules.whiteLabelPartners || 50);
        }
        // Load Bee Agent Policy
        if (config.beeAgentPolicy) {
          setCtvCommission(config.beeAgentPolicy.ctvCommission || 21);
          setStartupCommission(config.beeAgentPolicy.startupCommission || 25);
          setSponsorBonus(config.beeAgentPolicy.sponsorBonus || 8);
          setRankUpThreshold(config.beeAgentPolicy.rankUpThreshold || 9900000);
        }
        // Load Rank Upgrades (Admin 3.1)
        if (config.rankUpgrades && Array.isArray(config.rankUpgrades)) {
          setRankUpgrades(config.rankUpgrades);
        }
      }
    } catch (error) {
      adminLogger.error('Error fetching policy config', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived Values
  const totalPayoutPercent = retailComm + agencyBonus + elitePool;
  const isRisk = totalPayoutPercent > 45;

  const simGMV = simPartners * simAOV;
  const simTotalPayout = simGMV * (totalPayoutPercent / 100);
  const simProfit = simGMV - simTotalPayout - fixedCost;
  const profitMargin = simGMV > 0 ? (simProfit / simGMV) * 100 : 0;


  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const config = {
        commissions: { retailComm, agencyBonus, elitePool },
        rules: { activationThreshold, whiteLabelGMV, whiteLabelPartners },
        // 🆕 The Bee Agent Policy
        beeAgentPolicy: {
          ctvCommission,
          startupCommission,
          sponsorBonus,
          rankUpThreshold
        },
        // 🆕 Admin 3.1: Rank Upgrades
        rankUpgrades
      };

      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase
        .from('policy_config')
        .update({
          value: config,
          updated_at: new Date().toISOString(),
          updated_by: session?.user?.id || null
        })
        .eq('key', 'global_policy');

      if (error) throw error;

      setLastSaved(new Date().toLocaleTimeString('vi-VN'));
      alert('✅ Policy Configuration Saved Successfully! Changes are now live.');
    } catch (err) {
      const error = err as Error;
      adminLogger.error('Error saving policy config', error);
      alert(`❌ Failed to save configuration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  if (loading) {
    return (
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-2xl border border-slate-700 min-h-[800px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Policy Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-2xl border border-slate-700 min-h-[800px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            POLICY ENGINE v3.0 (Bee 3.0 Core)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Trung tâm điều phối chiến lược & Dòng tiền - Real-time Sync</p>
          {lastSaved && (
            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Last saved: {lastSaved}
            </p>
          )}
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 bg-[#FFBF00] text-[#00575A] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving...' : 'Lưu Cấu Hình'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CONFIGURATION */}
        <div className="lg:col-span-7 space-y-6">
          {/* Commission Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 className="text-lg font-bold mb-4 text-teal-400 flex items-center gap-2">
              <DollarSign size={20} /> Cấu Trúc Hoa Hồng (Multi-tier)
            </h3>

            {/* Retail */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Chiết khấu Bán lẻ (Retail Discount)</label>
                <motion.span
                  key={retailComm}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-[#FFBF00] font-bold"
                >
                  {retailComm}%
                </motion.span>
              </div>
              <input
                type="range"
                min="20"
                max="35"
                value={retailComm}
                onChange={(e) => setRetailComm(Number(e.target.value))}
                className="w-full accent-teal-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Dành cho người bán trực tiếp (Dropshipping).</p>
            </div>

            {/* Agency */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Thưởng Quản lý (Agency Bonus)</label>
                <motion.span
                  key={agencyBonus}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-[#FFBF00] font-bold"
                >
                  {agencyBonus}%
                </motion.span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                value={agencyBonus}
                onChange={(e) => setAgencyBonus(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Thưởng dựa trên doanh số nhóm (Volume-based).</p>
            </div>

            {/* Elite */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Quỹ Tinh hoa (Elite Pool)</label>
                <motion.span
                  key={elitePool}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-[#FFBF00] font-bold"
                >
                  {elitePool}%
                </motion.span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={elitePool}
                onChange={(e) => setElitePool(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Đồng chia cho Top 12 Tướng (The Zodiac).</p>
            </div>

            {/* Total Monitor */}
            <motion.div
              animate={{
                backgroundColor: isRisk ? 'rgba(127, 29, 29, 0.2)' : 'rgba(6, 78, 59, 0.2)',
                borderColor: isRisk ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
              }}
              className="p-4 rounded-lg border transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase">Tổng Payout (Max 45%)</span>
                <motion.span
                  key={totalPayoutPercent}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className={`text-2xl font-bold ${isRisk ? 'text-red-500' : 'text-green-400'}`}
                >
                  {totalPayoutPercent}%
                </motion.span>
              </div>
              {isRisk && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs mt-2"
                >
                  <AlertTriangle size={14} />
                  <span>Cảnh báo: Payout quá cao có thể gây thâm hụt dòng tiền vận hành!</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Game Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700"
          >
            <h3 className="text-lg font-bold mb-4 text-teal-400 flex items-center gap-2">
              <Target size={20} /> Luật Chơi & Kích Hoạt
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Điều kiện Kích hoạt (Pro Partner)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={activationThreshold}
                    onChange={(e) => setActivationThreshold(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-teal-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs">VND</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">White-label Trigger (GMV)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={whiteLabelGMV}
                    onChange={(e) => setWhiteLabelGMV(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-teal-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs">VND</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  White-label Trigger (Active Partners)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={whiteLabelPartners}
                    onChange={(e) => setWhiteLabelPartners(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-teal-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-xs">Partners</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🆕 THE BEE AGENT - Commission Tiers (NEW POLICY SECTION) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-900/20 to-slate-800 p-6 rounded-xl border-2 border-amber-500/30 shadow-lg"
          >
            <h3 className="text-lg font-bold mb-3 text-amber-400 flex items-center gap-2">
              <Zap size={20} className="animate-pulse" />
              🐝 The Bee Agent - Chính Sách Tự Động
            </h3>
            <p className="text-xs text-slate-400 mb-5 bg-slate-900/50 p-2 rounded">
              💡 Chính sách này <strong>tự động áp dụng</strong> khi The Bee xử lý đơn hàng (Supabase Edge Function)
            </p>

            {/* CTV Commission Slider */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-200">
                  Hoa hồng CTV <span className="text-xs text-slate-500">(Rank 8)</span>
                </label>
                <motion.span
                  key={ctvCommission}
                  initial={{ scale: 1.3, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#fbbf24' }}
                  className="text-amber-400 font-bold text-lg"
                >
                  {ctvCommission}%
                </motion.span>
              </div>
              <input
                type="range"
                min="15"
                max="25"
                value={ctvCommission}
                onChange={(e) => setCtvCommission(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Dành cho Cộng tác viên (CTV) - Rank thấp nhất</p>
            </div>

            {/* STARTUP+ Commission Slider */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-200">
                  Hoa hồng STARTUP+ <span className="text-xs text-slate-500">(Rank 7 trở lên)</span>
                </label>
                <motion.span
                  key={startupCommission}
                  initial={{ scale: 1.3, color: '#22c55e' }}
                  animate={{ scale: 1, color: '#22c55e' }}
                  className="text-green-400 font-bold text-lg"
                >
                  {startupCommission}%
                </motion.span>
              </div>
              <input
                type="range"
                min="20"
                max="30"
                value={startupCommission}
                onChange={(e) => setStartupCommission(Number(e.target.value))}
                className="w-full accent-green-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Khởi Nghiệp trở lên - Hoa hồng cao hơn</p>
            </div>

            {/* Sponsor Bonus Slider */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-200">
                  Thưởng F1 <span className="text-xs text-slate-500">(AMBASSADOR+ only)</span>
                </label>
                <motion.span
                  key={sponsorBonus}
                  initial={{ scale: 1.3, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#a855f7' }}
                  className="text-purple-400 font-bold text-lg"
                >
                  {sponsorBonus}%
                </motion.span>
              </div>
              <input
                type="range"
                min="5"
                max="12"
                value={sponsorBonus}
                onChange={(e) => setSponsorBonus(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">Sponsor (Đại Sứ+) nhận % từ doanh số F1 trực tiếp</p>
            </div>

            {/* Rank Up Threshold Input */}
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1 font-medium">
                Ngưỡng thăng hạng STARTUP (VND)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rankUpThreshold}
                  onChange={(e) => setRankUpThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-3 text-white focus:border-amber-500 outline-none font-mono"
                />
                <span className="absolute right-3 top-3 text-slate-500 text-xs font-bold">VND</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Khi <strong>lifetime sales ≥ ngưỡng này</strong>, CTV tự động lên STARTUP
              </p>
            </div>

            {/* Info Box */}
            <div className="mt-5 p-3 bg-gradient-to-r from-emerald-900/30 to-green-900/20 rounded-lg border border-emerald-500/30">
              <div className="text-xs text-emerald-200 leading-relaxed">
                <strong className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  ✅ Real-time Sync Enabled:
                </strong>
                <br />
                Mọi thay đổi sẽ <strong>tự động áp dụng</strong> cho Edge Function <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300">agent-reward</code> ng

                ay lập tức. Không cần redeploy!
              </div>
            </div>
          </motion.div>

          {/* 🎖️ Admin 3.1: RANK LADDER (Dynamic Rank Upgrades) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-900/20 to-slate-800 p-6 rounded-xl border-2 border-purple-500/30 shadow-lg"
          >
            <h3 className="text-lg font-bold mb-3 text-purple-400 flex items-center gap-2">
              🎖️ Thang Hạng Động (Dynamic Rank Ladder)
            </h3>
            <p className="text-xs text-slate-400 mb-5 bg-slate-900/50 p-2 rounded">
              💡 Cấu hình điều kiện thăng hạng cho <strong>tất cả các bậc</strong>. Multi-condition: Sales + Team Volume + Downlines.
            </p>

            {/* Rank Upgrades Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 text-slate-400 font-medium">From → To</th>
                    <th className="text-left p-2 text-slate-400 font-medium">Sales Required (VND)</th>
                    <th className="text-left p-2 text-slate-400 font-medium">Team Volume (VND)</th>
                    <th className="text-left p-2 text-slate-400 font-medium">Downlines (#)</th>
                    <th className="text-left p-2 text-slate-400 font-medium">Min Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {rankUpgrades.map((upgrade, index) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-2">
                        <span className="text-white font-medium">{upgrade.name}</span>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={upgrade.conditions.salesRequired || 0}
                          onChange={(e) => {
                            const newUpgrades = [...rankUpgrades];
                            newUpgrades[index].conditions.salesRequired = Number(e.target.value);
                            setRankUpgrades(newUpgrades);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-purple-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={upgrade.conditions.teamVolumeRequired || 0}
                          onChange={(e) => {
                            const newUpgrades = [...rankUpgrades];
                            newUpgrades[index].conditions.teamVolumeRequired = Number(e.target.value);
                            setRankUpgrades(newUpgrades);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-purple-500 outline-none"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={upgrade.conditions.directDownlinesRequired || 0}
                          onChange={(e) => {
                            const newUpgrades = [...rankUpgrades];
                            newUpgrades[index].conditions.directDownlinesRequired = Number(e.target.value);
                            setRankUpgrades(newUpgrades);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-purple-500 outline-none"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={upgrade.conditions.minDownlineRank || 0}
                          onChange={(e) => {
                            const newUpgrades = [...rankUpgrades];
                            newUpgrades[index].conditions.minDownlineRank = Number(e.target.value);
                            setRankUpgrades(newUpgrades);
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-purple-500 outline-none"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info Box */}
            <div className="mt-5 p-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/20 rounded-lg border border-purple-500/30">
              <div className="text-xs text-purple-200 leading-relaxed">
                <strong className="text-purple-400">💡 Multi-Condition Logic:</strong>
                <br />
                Để thăng hạng, user phải đạt <strong>TẤT CẢ</strong> điều kiện (AND logic). Để bỏ qua điều kiện, để trống hoặc = 0.
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: SIMULATION */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 h-full"
          >
            <h3 className="text-lg font-bold mb-6 text-[#FFBF00] flex items-center gap-2">
              <TrendingUp size={20} /> Mô Phỏng Dòng Tiền (VC View)
            </h3>

            {/* Inputs */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs text-slate-400">Số lượng Partner giả định</label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={simPartners}
                  onChange={(e) => setSimPartners(Number(e.target.value))}
                  className="w-full accent-white h-1 bg-slate-600 rounded-lg cursor-pointer mt-2"
                />
                <div className="text-right font-mono text-teal-400">{simPartners.toLocaleString()} người</div>
              </div>
              <div>
                <label className="text-xs text-slate-400">AOV (Giá trị đơn trung bình)</label>
                <input
                  type="number"
                  value={simAOV}
                  onChange={(e) => setSimAOV(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm mt-1 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Chi phí cố định (Fixed Cost/Tháng)</label>
                <input
                  type="number"
                  value={fixedCost}
                  onChange={(e) => setFixedCost(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm mt-1 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4 border-t border-slate-700 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-2">
                  <Zap size={14} className="text-teal-400" />
                  Tổng Doanh Thu (GMV)
                </span>
                <motion.span
                  key={simGMV}
                  initial={{ scale: 1.1, color: '#FFBF00' }}
                  animate={{ scale: 1, color: '#FFFFFF' }}
                  className="text-xl font-bold"
                >
                  {formatVND(simGMV)}
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tổng Chi Trả (Payout)</span>
                <motion.span
                  key={simTotalPayout}
                  initial={{ scale: 1.1, color: '#FFBF00' }}
                  animate={{ scale: 1, color: '#fb7185' }}
                  className="text-lg font-bold text-red-400"
                >
                  -{formatVND(simTotalPayout)}
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Chi Phí Cố Định</span>
                <span className="text-lg font-bold text-orange-400">-{formatVND(fixedCost)}</span>
              </div>

              <div className="mt-6 p-4 bg-teal-900/30 rounded-xl border border-teal-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-teal-200 font-medium">Lợi Nhuận Ròng (EBITDA)</span>
                  <motion.span
                    key={simProfit}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-2xl font-bold ${simProfit > 0 ? 'text-green-400' : 'text-red-500'}`}
                  >
                    {formatVND(simProfit)}
                  </motion.span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  Margin:{' '}
                  <span className={profitMargin > 0 ? 'text-green-400' : 'text-red-400'}>
                    {profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Health Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(Math.max(profitMargin, 0), 100)}%`,
                          backgroundColor:
                            profitMargin > 20 ? '#22c55e' : profitMargin > 10 ? '#eab308' : '#ef4444',
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                    <span
                      className={`font-bold ${profitMargin > 20 ? 'text-green-400' : profitMargin > 10 ? 'text-yellow-400' : 'text-red-400'
                        }`}
                    >
                      {profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : 'At Risk'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEngine;
