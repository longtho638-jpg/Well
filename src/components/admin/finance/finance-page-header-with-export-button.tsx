/**
 * Finance page header: title block + refresh button + export-CSV button.
 * Extracted from Finance.tsx to keep parent under 200 LOC.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface FinancePageHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
}

export const FinancePageHeader: React.FC<FinancePageHeaderProps> = ({ loading, onRefresh, onExportCSV }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00575A] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,87,90,0.3)]">
            <ShieldCheck className="text-emerald-400" size={28} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            {t('finance.treasury_control')}
          </h2>
        </div>
        <p className="text-zinc-500 font-medium text-lg">
          {t('finance.platform_liquidity_verificatio')}
          <span className="text-teal-400 font-bold uppercase italic">{t('finance.automated_fraud_detection')}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={loading}
          className="p-4 bg-zinc-900 border border-white/5 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all text-zinc-400 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExportCSV}
          className="flex items-center gap-3 bg-zinc-900 text-zinc-300 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic border border-white/5 hover:border-teal-500/30 transition-all shadow-xl"
        >
          <Download size={18} />
          {t('finance.export_ledger')}
        </motion.button>
      </div>
    </motion.div>
  );
};
