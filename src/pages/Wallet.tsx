import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Download,
  Upload,
  Lock,
  Copy,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  Clock,
  Hash,
  Coins,
  Zap,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import type { Transaction, TokenType } from '@/types';
import { formatToken, calculateStakingReward } from '@/utils/tokenomics';

// Counter Animation Component
const AnimatedCounter: React.FC<{ value: number; decimals?: number }> = ({
  value,
  decimals = 0,
}) => {
    const { t } = useTranslation();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return latest.toFixed(decimals);
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
};

export const Wallet: React.FC = () => {
  const { t } = useTranslation();
  const { user, transactions } = useStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'SHOP' | 'GROW'>('all');
  const [hideBalance, setHideBalance] = useState(false);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredTransactions = transactions.filter((tx) =>
    filter === 'all' ? true : tx.currency === filter
  );

  // Calculate total balances
  const totalShopBalance = user.shopBalance;
  const totalGrowBalance = user.growBalance + user.stakedGrowBalance;
  const totalPortfolioVND = totalShopBalance / 1000 + (totalGrowBalance * 50000); // GROW @ 50k VND

  // Transaction type translation mapping
  const getTransactionType = (type: string) => {
    switch (type) {
      case 'Direct Sale':
        return t('wallet.transactions.types.directSale');
      case 'Team Volume Bonus':
        return t('wallet.transactions.types.teamBonus');
      case 'Withdrawal':
        return t('wallet.transactions.types.withdrawal');
      default:
        return type;
    }
  };

  // Status translation mapping
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('wallet.transactions.statusValues.pending');
      case 'completed':
        return t('wallet.transactions.statusValues.completed');
      case 'failed':
        return t('wallet.transactions.statusValues.failed');
      case 'cancelled':
        return t('wallet.transactions.statusValues.cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-300">
      {/* Hero Section - Total Portfolio */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden"
      >
        {/* Gradient Background with Mesh Effect */}
        {/* Gradient Background with Mesh Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-zinc-900 to-black rounded-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        {/* Content */}
        <div className="relative p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <WalletIcon className="w-8 h-8 text-white/90" />
                <h1 className="text-2xl font-bold text-white">{t('wallet.title')}</h1>
              </div>
              <p className="text-white/70 text-sm">{t('wallet.subtitle')}</p>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all border border-white/20"
            >
              {hideBalance ? (
                <EyeOff className="w-5 h-5 text-white" />
              ) : (
                <Eye className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Total Portfolio Value */}
          <div className="mb-4">
            <p className="text-zinc-200 text-sm mb-2">{t('wallet.t_ng_t_i_s_n')}</p>
            {hideBalance ? (
              <p className="text-6xl font-bold text-white">••••••</p>
            ) : (
              <div className="flex items-baseline gap-3">
                <h2 className="text-6xl font-bold text-white font-mono">
                  <AnimatedCounter value={totalPortfolioVND} decimals={0} />
                </h2>
                <span className="text-2xl text-zinc-300">{t('common.currency.vnd')}</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-300 text-xs">{t('wallet.th_ng_n_y')}</p>
                <p className="text-emerald-300 font-semibold">{t('wallet.12_5')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-zinc-300 text-xs">{t('wallet.apy_staking')}</p>
                <p className="text-cyan-300 font-semibold">{t('wallet.12_0')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dual Asset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SHOP Token Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />

          {/* Card Content - Glassmorphism */}
          <div className="relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-all shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white text-lg font-bold">
                    {t('wallet.balance.shopToken')}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">{t('wallet.vnd_stablecoin_1_1000')}</p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
                {t('wallet.balance.total')}
              </p>
              {hideBalance ? (
                <p className="text-5xl font-bold text-zinc-900 dark:text-white">••••••</p>
              ) : (
                <>
                  <p className="text-5xl font-bold text-zinc-900 dark:text-white font-mono mb-1">
                    <AnimatedCounter value={totalShopBalance} decimals={0} />
                  </p>
                  <p className="text-teal-600 dark:text-teal-400 text-lg font-mono">
                    ≈ {(totalShopBalance / 1000).toLocaleString('vi-VN')} {t('common.currency.vnd')}
                  </p>
                </>
              )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.available')}
                </p>
                <p className="text-white font-mono text-sm font-semibold">
                  {hideBalance ? '••••' : user.shopBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
                  {t('wallet.balance.locked')}
                </p>
                <p className="text-amber-500 dark:text-amber-400 font-mono text-sm font-semibold">0</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
                  {t('wallet.balance.staked')}
                </p>
                <p className="text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold">0</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-500/40 hover:shadow-2xl hover:shadow-teal-500/50 hover:-translate-y-0.5">
                <Download className="w-5 h-5" />
                {t('wallet.n_p_shop')}</button>
              <button className="flex-1 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:-translate-y-0.5 shadow-sm">
                <Upload className="w-5 h-5" />
                {t('wallet.actions.withdraw')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* GROW Token Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />

          {/* Card Content - Glassmorphism */}
          <div className="relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 hover:border-purple-500/30 transition-all shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white text-lg font-bold">
                    {t('wallet.balance.growToken')}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">{t('wallet.governance_token')}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                {t('wallet.staking.apy')} {t('wallet.12')}</div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
                {t('wallet.balance.total')}
              </p>
              {hideBalance ? (
                <p className="text-5xl font-bold text-zinc-900 dark:text-white">••••••</p>
              ) : (
                <>
                  <p className="text-5xl font-bold text-zinc-900 dark:text-white font-mono mb-1">
                    <AnimatedCounter value={totalGrowBalance} decimals={2} />
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 text-lg font-mono">{t('wallet.grow')}</p>
                </>
              )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.available')}
                </p>
                <p className="text-white font-mono text-sm font-semibold">
                  {hideBalance ? '••••' : user.growBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
                  {t('wallet.balance.locked')}
                </p>
                <p className="text-amber-500 dark:text-amber-400 font-mono text-sm font-semibold">0</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
                  {t('wallet.balance.staked')}
                </p>
                <p className="text-purple-600 dark:text-purple-400 font-mono text-sm font-semibold">
                  {hideBalance ? '••••' : user.stakedGrowBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Staking Info */}
            {user.stakedGrowBalance > 0 && !hideBalance && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-xs mb-1">
                      {t('wallet.staking.estimatedReward')} {t('wallet.90')}{t('wallet.staking.days', { count: 90 })})
                    </p>
                    <p className="text-purple-200 font-mono text-lg font-bold flex items-center gap-2">
                      +{calculateStakingReward(user.stakedGrowBalance, 0.12, 90).toFixed(2)} {t('wallet.grow_1')}<TrendingUp className="w-4 h-4 text-green-400" />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-0.5">
                <Lock className="w-5 h-5" />
                {t('wallet.actions.stake')}
              </button>
              <button className="flex-1 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:-translate-y-0.5 shadow-sm">
                <TrendingUp className="w-5 h-5" />
                {t('wallet.staking.rewards')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction History - Blockchain Explorer Style */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        {/* Subtle Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-50" />

        {/* Card */}
        <div className="relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 transition-all shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-[#00FFA3]/20 rounded-xl">
                  <Hash className="w-6 h-6 text-emerald-600 dark:text-[#00FFA3]" />
                </div>
                {t('wallet.transactions.title')}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">{t('wallet.blockchain_explorer')}</p>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2">
              {(['all', 'SHOP', 'GROW'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === f
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all duration-200'
                    }`}
                >
                  {f === 'all' ? t('common.filter') : f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.transactions.date')}
                  </th>
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.transactions.type')}
                  </th>
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.transactions.amount')}
                  </th>
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.currency')}</th>
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.transactions.status')}
                  </th>
                  <th className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4">
                    {t('wallet.transactions.hash')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}

                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group/row"
                  >
                    <td className="py-4 px-4">
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-zinc-500 text-xs font-mono">
                        {new Date(tx.date).toLocaleTimeString('vi-VN')}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-zinc-900 dark:text-white text-sm font-medium">{getTransactionType(tx.type)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`font-mono text-sm font-bold ${tx.type === 'Withdrawal' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                        {tx.type === 'Withdrawal' ? '-' : '+'}
                        {tx.amount.toLocaleString()}
                      </p>
                      {tx.taxDeducted && tx.taxDeducted > 0 && (
                        <p className="text-zinc-500 text-xs font-mono">
                          {t('wallet.transactions.tax')}: -{tx.taxDeducted.toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tx.currency === 'SHOP'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 dark:bg-gradient-to-r dark:from-purple-500/20 dark:to-pink-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                          }`}
                      >
                        {tx.currency === 'SHOP' ? (
                          <Coins className="w-3.5 h-3.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        {tx.currency}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                          }`}
                      >
                        {tx.status === 'completed' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {getStatusText(tx.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-emerald-600 dark:text-emerald-400 text-xs font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </code>
                        <button
                          onClick={() => handleCopyHash(tx.hash)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all group/btn opacity-0 group-hover/row:opacity-100"
                          title={t('common.copy')}
                        >
                          {copiedHash === tx.hash ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400" />
                          )}
                        </button>
                        <a
                          href={`https://bscscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all group/btn opacity-0 group-hover/row:opacity-100"
                          title="View on BSCScan"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400" />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {
            filteredTransactions.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center">
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <Hash className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
                  </div>
                </div>
                <p className="text-zinc-500 text-lg font-medium mb-1">
                  {t('wallet.transactions.noTransactions')}
                </p>
                <p className="text-zinc-600 text-sm">
                  {filter === 'all'
                    ? 'Your transaction history will appear here'
                    : `No ${filter} transactions yet`}
                </p>
              </div>
            )
          }
        </div>
      </motion.div>
    </div>
  );
};
