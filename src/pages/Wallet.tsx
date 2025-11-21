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
  const t = useTranslation();
  const { user, transactions } = useStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'SHOP' | 'GROW'>('all');

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1A1F3A] to-[#0A0E27] p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <WalletIcon className="w-10 h-10 text-[#00FFA3]" />
          {t('wallet.title')}
        </h1>
        <p className="text-gray-400">{t('wallet.subtitle')}</p>
      </motion.div>

      {/* Token Balances Grid */}
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

          {/* Card Content */}
          <div className="relative bg-gradient-to-br from-[#1A1F3A]/90 to-[#0A0E27]/90 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 hover:border-teal-500/60 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {t('wallet.balance.shopToken')}
                  </p>
                  <p className="text-gray-500 text-xs">VND Stablecoin</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-semibold">
                1:1000 VND
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">
                {t('wallet.balance.total')}
              </p>
              <p className="text-5xl font-bold text-white font-mono mb-2">
                <AnimatedCounter value={totalShopBalance} decimals={0} />
              </p>
              <p className="text-gray-400 text-lg font-mono">
                ≈ {(totalShopBalance / 1000).toLocaleString('vi-VN')} {t('common.currency.vnd')}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/30 rounded-xl">
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.available')}
                </p>
                <p className="text-white font-mono text-sm">
                  {user.shopBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.locked')}
                </p>
                <p className="text-amber-400 font-mono text-sm">0</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.staked')}
                </p>
                <p className="text-teal-400 font-mono text-sm">0</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30">
                <Download className="w-4 h-4" />
                Nạp SHOP
              </button>
              <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20">
                <Upload className="w-4 h-4" />
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />

          {/* Card Content */}
          <div className="relative bg-gradient-to-br from-[#1A1F3A]/90 to-[#0A0E27]/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/60 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {t('wallet.balance.growToken')}
                  </p>
                  <p className="text-gray-500 text-xs">Governance Token</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                {t('wallet.staking.apy')} 12%
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">
                {t('wallet.balance.total')}
              </p>
              <p className="text-5xl font-bold text-white font-mono mb-2">
                <AnimatedCounter value={totalGrowBalance} decimals={2} />
              </p>
              <p className="text-gray-400 text-lg font-mono">GROW</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-black/30 rounded-xl">
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.available')}
                </p>
                <p className="text-white font-mono text-sm">
                  {user.growBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.locked')}
                </p>
                <p className="text-amber-400 font-mono text-sm">0</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {t('wallet.balance.staked')}
                </p>
                <p className="text-purple-400 font-mono text-sm">
                  {user.stakedGrowBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Staking Info */}
            {user.stakedGrowBalance > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">
                      {t('wallet.staking.estimatedReward')} (90 {t('wallet.staking.days', { count: 90 })})
                    </p>
                    <p className="text-purple-300 font-mono text-lg font-semibold">
                      +{calculateStakingReward(user.stakedGrowBalance, 0.12, 90).toFixed(2)} GROW
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
                <Lock className="w-4 h-4" />
                {t('wallet.actions.stake')}
              </button>
              <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20">
                <TrendingUp className="w-4 h-4" />
                {t('wallet.staking.rewards')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#1A1F3A]/90 to-[#0A0E27]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Hash className="w-6 h-6 text-[#00FFA3]" />
            {t('wallet.transactions.title')}
          </h2>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'SHOP', 'GROW'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === f
                    ? 'bg-[#00FFA3] text-black'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  {t('wallet.transactions.date')}
                </th>
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  {t('wallet.transactions.type')}
                </th>
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  {t('wallet.transactions.amount')}
                </th>
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  Currency
                </th>
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  {t('wallet.transactions.status')}
                </th>
                <th className="text-left text-gray-400 font-medium text-sm py-4 px-4">
                  {t('wallet.transactions.hash')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <p className="text-gray-300 text-sm">
                      {new Date(tx.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.date).toLocaleTimeString('vi-VN')}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white text-sm">{getTransactionType(tx.type)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white font-mono text-sm font-semibold">
                      {tx.type === 'Withdrawal' ? '-' : '+'}
                      {tx.amount.toLocaleString()}
                    </p>
                    {tx.taxDeducted && tx.taxDeducted > 0 && (
                      <p className="text-gray-500 text-xs">
                        {t('wallet.transactions.tax')}: {tx.taxDeducted.toLocaleString()}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.currency === 'SHOP'
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {tx.currency === 'SHOP' ? (
                        <Coins className="w-3 h-3" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      {tx.currency}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {getStatusText(tx.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <code className="text-[#00FFA3] text-xs font-mono">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </code>
                      <button
                        onClick={() => handleCopyHash(tx.hash)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                        title={t('common.copy')}
                      >
                        {copiedHash === tx.hash ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#00FFA3]" />
                        )}
                      </button>
                      <a
                        href={`https://bscscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                        title="View on BSCScan"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#00FFA3]" />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {t('wallet.transactions.noTransactions')}
            </p>
            <p className="text-gray-500 text-sm">
              {filter === 'all'
                ? 'Your transaction history will appear here'
                : `No ${filter} transactions yet`}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
