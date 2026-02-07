import React, { useState } from 'react';
import { Wallet, ShieldAlert, Download, ArrowDownLeft, Info, Sparkles, TrendingUp, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatVND } from '../utils/format';
import { calculatePIT } from '../utils/tax';
import { useStore } from '../store';
import { WithdrawalModal } from './WithdrawalModal';
import { useTranslation } from '@/hooks';
import { useCommissionPDFReport } from '@/hooks/use-commission-pdf-report-generator';

const CommissionWallet: React.FC = () => {
    const { t } = useTranslation();
  const { transactions, user } = useStore();
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const { generatePDF, isGenerating } = useCommissionPDFReport();

  const processedTransactions = transactions.map(t => {
    const { taxAmount, isTaxable } = calculatePIT(t.amount);
    return { ...t, taxDeducted: taxAmount, isTaxable };
  });

  const totalGross = processedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTax = processedTransactions.reduce((sum, t) => sum + t.taxDeducted, 0);
  const totalNet = totalGross - totalTax;

  const handleExportPDF = async () => {
    const now = new Date();
    const monthName = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    // Convert transactions to commission items
    const commissions = processedTransactions.map(tx => ({
      date: tx.date,
      type: (tx.type.toLowerCase().includes('direct') ? 'direct' : 'sponsor') as 'direct' | 'sponsor',
      amount: tx.amount,
      orderId: tx.id,
      fromUser: tx.type,
    }));

    const totalDirect = commissions
      .filter(c => c.type === 'direct')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalSponsor = commissions
      .filter(c => c.type === 'sponsor')
      .reduce((sum, c) => sum + c.amount, 0);

    const reportData = {
      userName: user?.name || 'User',
      userEmail: user?.email || '',
      month: monthName,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      commissions,
      totalDirect,
      totalSponsor,
      totalEarned: totalGross,
      currentBalance: totalNet,
    };

    try {
      await generatePDF(reportData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Date', 'Ref ID', 'Type', 'Gross Amount (VND)', 'Tax Deducted (VND)', 'Net Received (VND)', 'Status'];

    // Create CSV rows
    const rows = processedTransactions.map(t => [
      t.date,
      t.id,
      t.type,
      t.amount,
      t.taxDeducted || 0,
      t.amount - (t.taxDeducted || 0),
      t.status
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['SUMMARY', '', '', totalGross, totalTax, totalNet, '']);

    // Combine into CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `wellnexus_earnings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-brand-primary to-teal-900 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-slate-300 opacity-5 dark:opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-teal-200 dark:text-slate-300 text-sm uppercase tracking-wider font-medium mb-1">{t('commissionwallet.withdrawable_balance')}</p>
              <h2 className="text-4xl font-bold tracking-tight dark:text-slate-100">{formatVND(totalNet)}</h2>
            </div>
            <div className="bg-white/10 dark:bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10 dark:border-slate-600/50"><Wallet className="w-6 h-6 text-brand-accent dark:text-yellow-400" /></div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/10 dark:border-slate-600/50 pt-6 relative z-10">
            <div>
              <p className="text-teal-300 dark:text-slate-300 text-xs mb-1">{t('commissionwallet.total_earnings_gross')}</p>
              <p className="font-semibold text-lg dark:text-slate-100">{formatVND(totalGross)}</p>
            </div>
            <div>
              <p className="text-red-300 dark:text-red-400 text-xs mb-1 flex items-center gap-1">
                {t('commissionwallet.withheld_tax_pit_10')}<span className="group/tooltip relative"><Info className="w-3 h-3 cursor-help" /></span>
              </p>
              <p className="font-semibold text-lg text-red-200 dark:text-red-300">-{formatVND(totalTax)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center items-center text-center">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-full mb-3"><ShieldAlert className="w-6 h-6 text-yellow-600 dark:text-yellow-400" /></div>
            <h4 className="font-bold text-gray-800 dark:text-slate-100 mb-1">{t('commissionwallet.tax_compliance_mode')}</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {t('commissionwallet.wellnexus_automatically_deduct')}<span className="font-bold text-gray-700 dark:text-slate-300">{t('commissionwallet.10_pit')}</span> {t('commissionwallet.for_income_exceeding_2_000_000')}</p>
          </div>
          <button
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="bg-brand-accent hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-brand-primary dark:text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-900/10 dark:shadow-yellow-400/20 transition transform active:scale-95 flex items-center justify-center gap-2"
            aria-label="Open withdrawal request modal"
          >
            <ArrowDownLeft className="w-5 h-5" /> {t('commissionwallet.request_withdrawal')}</button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-slate-100">{t('commissionwallet.earnings_history')}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="text-sm text-brand-primary dark:text-teal-400 font-medium flex items-center gap-1 hover:underline"
              aria-label="Export earnings statement as CSV"
            >
              <Download className="w-4 h-4" /> {t('commissionwallet.export_statement')}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              aria-label="Export commission report as PDF"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Xuất PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 dark:text-slate-500 uppercase bg-gray-50/50 dark:bg-slate-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">{t('commissionwallet.date_ref')}</th>
                <th scope="col" className="px-6 py-4 font-medium">{t('commissionwallet.type')}</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">{t('commissionwallet.gross_amount')}</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">{t('commissionwallet.pit_10')}</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">{t('commissionwallet.net_received')}</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">{t('commissionwallet.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {processedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-slate-100">{tx.date}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{tx.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tx.type.includes('Bonus') ? 'bg-purple-500 dark:bg-purple-400' : 'bg-blue-500 dark:bg-blue-400'}`}></div>
                        <span className="text-gray-700 dark:text-slate-300 font-medium">{tx.type}</span>

                        {/* WOW: Larger Badge for Bee Rewards */}
                        {tx.metadata?.trigger_agent === 'the_bee' && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="ml-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-full shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">{t('commissionwallet.the_bee')}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* WOW TRACEABILITY BADGE */}
                      {tx.metadata?.source_tx_id && (
                        <div className="flex items-center gap-1 ml-4">
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t('commissionwallet.source')}</span>
                          <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600 font-mono">
                            {tx.metadata.source_tx_id}
                          </span>
                        </div>
                      )}

                      {/* WOW: Commission Breakdown Tooltip */}
                      {tx.metadata?.calculation_base && tx.metadata?.applied_rate && (
                        <div className="flex items-center gap-1 ml-4 group relative">
                          <TrendingUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                            {formatVND(Number(tx.metadata.calculation_base))} × {(Number(tx.metadata.applied_rate) * 100).toFixed(0)}%
                          </span>
                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 bg-slate-900 dark:bg-slate-700 text-white text-[10px] px-2 py-1.5 rounded shadow-lg whitespace-nowrap">
                            <div className="font-bold mb-0.5">{t('commissionwallet.commission_calculation')}</div>
                            <div>{t('commissionwallet.bonus_revenue')}{formatVND(Number(tx.metadata.calculation_base))}</div>
                            <div>{t('commissionwallet.rate')}{tx.metadata.user_rank_snapshot || 'Member'}): {(Number(tx.metadata.applied_rate) * 100).toFixed(0)}%</div>
                            <div className="border-t border-slate-600 dark:border-slate-500 mt-1 pt-1">= {formatVND(tx.amount)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-400 font-medium">{formatVND(tx.amount)}</td>
                  <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">{(tx.taxDeducted && tx.taxDeducted > 0) ? `-${formatVND(tx.taxDeducted)}` : '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-primary dark:text-teal-400">{formatVND(tx.amount - (tx.taxDeducted || 0))}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${tx.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'}`}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={totalNet}
      />
    </div>
  );
};

export default CommissionWallet;