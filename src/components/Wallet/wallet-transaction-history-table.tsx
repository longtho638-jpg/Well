/**
 * Wallet Transaction History Table — blockchain explorer style listing with filter pills and empty state
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { Transaction } from '@/types';
import { useWalletTransactionFilterAndLabelTranslator } from './use-wallet-transaction-filter-and-label-translator';
import { WalletTransactionTableRow } from './wallet-transaction-table-row';

interface Props {
  transactions: Transaction[];
}

export default function WalletTransactionHistoryTable({ transactions }: Props) {
  const { t } = useTranslation();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const { filter, setFilter, getTransactionType, getStatusText, i18n } =
    useWalletTransactionFilterAndLabelTranslator();

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredTransactions = transactions.filter((tx) =>
    filter === 'all' ? true : tx.currency === filter
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-50" />

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
                {[
                  t('wallet.transactions.date'),
                  t('wallet.transactions.type'),
                  t('wallet.transactions.amount'),
                  t('wallet.balance.currency'),
                  t('wallet.transactions.status'),
                  t('wallet.transactions.hash'),
                ].map((heading) => (
                  <th
                    key={heading}
                    className="text-left text-zinc-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider py-4 px-4"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <WalletTransactionTableRow
                  key={tx.id}
                  tx={tx}
                  index={index}
                  copiedHash={copiedHash}
                  locale={i18n.language}
                  onCopyHash={handleCopyHash}
                  getTransactionType={getTransactionType}
                  getStatusText={getStatusText}
                />
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
