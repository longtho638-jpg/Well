/**
 * Wallet Transaction History Table Component
 * Blockchain explorer style transaction listing
 * Features:
 * - Filter by currency (all/SHOP/GROW)
 * - Transaction details: date, type, amount, currency, status, hash
 * - Copy hash to clipboard functionality
 * - External blockchain explorer link
 * - Animated table rows
 * - Empty state handling
 * - Responsive design
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  Coins,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
}

export default function WalletTransactionHistoryTable({
  transactions,
}: Props) {
  const { t, i18n } = useTranslation();
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
            <p className="text-zinc-500 text-sm mt-1">{t('wallet.transactions.explorer')}</p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            {(['all', 'SHOP', 'GROW'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  filter === f
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
                  {t('wallet.balance.currency')}
                </th>
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
                      {new Date(tx.date).toLocaleDateString(i18n.language)}
                    </p>
                    <p className="text-zinc-500 text-xs font-mono">
                      {new Date(tx.date).toLocaleTimeString(i18n.language)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-zinc-900 dark:text-white text-sm font-medium">{getTransactionType(tx.type)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p
                      className={`font-mono text-sm font-bold ${
                        tx.type === 'Withdrawal' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        tx.currency === 'SHOP'
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        tx.status === 'completed'
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
                      {tx.hash ? (
                        <>
                          <code className="text-emerald-600 dark:text-emerald-400 text-xs font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </code>
                          <button
                            onClick={() => tx.hash && handleCopyHash(tx.hash)}
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
                            title={t('wallet.transactions.viewOnBscScan')}
                          >
                            <ExternalLink className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400" />
                          </a>
                        </>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
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
                ? t('wallet.transactions.emptyState')
                : t('wallet.transactions.emptyStateFilter', { filter })}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
