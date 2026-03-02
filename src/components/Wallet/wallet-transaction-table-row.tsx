/**
 * Wallet Transaction Table Row — single row with amount, currency badge, status badge, and hash actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Coins,
  Zap,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { Transaction } from '@/types';

interface Props {
  tx: Transaction;
  index: number;
  copiedHash: string | null;
  locale: string;
  onCopyHash: (hash: string) => void;
  getTransactionType: (type: string) => string;
  getStatusText: (status: string) => string;
}

export const WalletTransactionTableRow: React.FC<Props> = ({
  tx,
  index,
  copiedHash,
  locale,
  onCopyHash,
  getTransactionType,
  getStatusText,
}) => {
  const { t } = useTranslation();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group/row"
    >
      <td className="py-4 px-4">
        <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
          {new Date(tx.date).toLocaleDateString(locale)}
        </p>
        <p className="text-zinc-500 text-xs font-mono">
          {new Date(tx.date).toLocaleTimeString(locale)}
        </p>
      </td>

      <td className="py-4 px-4">
        <p className="text-zinc-900 dark:text-white text-sm font-medium">
          {getTransactionType(tx.type)}
        </p>
      </td>

      <td className="py-4 px-4">
        <p className={`font-mono text-sm font-bold ${
          tx.type === 'Withdrawal' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
        }`}>
          {tx.type === 'Withdrawal' ? '-' : '+'}{tx.amount.toLocaleString()}
        </p>
        {tx.taxDeducted && tx.taxDeducted > 0 && (
          <p className="text-zinc-500 text-xs font-mono">
            {t('wallet.transactions.tax')}: -{tx.taxDeducted.toLocaleString()}
          </p>
        )}
      </td>

      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
          tx.currency === 'SHOP'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-purple-500/10 dark:bg-gradient-to-r dark:from-purple-500/20 dark:to-pink-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
        }`}>
          {tx.currency === 'SHOP' ? <Coins className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          {tx.currency}
        </span>
      </td>

      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
          tx.status === 'completed'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
        }`}>
          {tx.status === 'completed'
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <Clock className="w-3.5 h-3.5" />}
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
                onClick={() => tx.hash && onCopyHash(tx.hash)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all group/btn opacity-0 group-hover/row:opacity-100"
                title={t('common.copy')}
              >
                {copiedHash === tx.hash
                  ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  : <Copy className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400" />}
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
  );
};
