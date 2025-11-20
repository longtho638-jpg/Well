import React, { useState } from 'react';
import { Wallet, ShieldAlert, Download, ArrowDownLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatVND } from '../utils/format';
import { calculatePIT } from '../utils/tax';
import { useStore } from '../store';
import { WithdrawalModal } from './WithdrawalModal';

const CommissionWallet: React.FC = () => {
  const { transactions } = useStore();
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const processedTransactions = transactions.map(t => {
     const { taxAmount, isTaxable } = calculatePIT(t.amount);
     return { ...t, taxDeducted: taxAmount, isTaxable };
  });

  const totalGross = processedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTax = processedTransactions.reduce((sum, t) => sum + t.taxDeducted, 0);
  const totalNet = totalGross - totalTax;

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
        <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-brand-primary to-teal-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <p className="text-teal-200 text-sm uppercase tracking-wider font-medium mb-1">Withdrawable Balance</p>
                    <h2 className="text-4xl font-bold tracking-tight">{formatVND(totalNet)}</h2>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10"><Wallet className="w-6 h-6 text-brand-accent" /></div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6 relative z-10">
                <div>
                    <p className="text-teal-300 text-xs mb-1">Total Earnings (Gross)</p>
                    <p className="font-semibold text-lg">{formatVND(totalGross)}</p>
                </div>
                <div>
                    <p className="text-red-300 text-xs mb-1 flex items-center gap-1">
                        Withheld Tax (PIT 10%)
                        <span className="group/tooltip relative"><Info className="w-3 h-3 cursor-help" /></span>
                    </p>
                    <p className="font-semibold text-lg text-red-200">-{formatVND(totalTax)}</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                <div className="bg-yellow-50 p-3 rounded-full mb-3"><ShieldAlert className="w-6 h-6 text-yellow-600" /></div>
                <h4 className="font-bold text-gray-800 mb-1">Tax Compliance Mode</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                    WellNexus automatically deducts <span className="font-bold text-gray-700">10% PIT</span> for income exceeding 2,000,000 VNĐ per Vietnam Law.
                </p>
            </div>
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold py-4 rounded-xl shadow-lg shadow-yellow-900/10 transition transform active:scale-95 flex items-center justify-center gap-2"
              aria-label="Open withdrawal request modal"
            >
                <ArrowDownLeft className="w-5 h-5" /> Request Withdrawal
            </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Earnings History</h3>
            <button
              onClick={handleExportCSV}
              className="text-sm text-brand-primary font-medium flex items-center gap-1 hover:underline"
              aria-label="Export earnings statement as CSV"
            >
              <Download className="w-4 h-4" /> Export Statement
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Date & Ref</th>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Gross Amount</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">PIT (10%)</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Net Received</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{t.date}</div>
                    <div className="text-xs text-gray-400">{t.id}</div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.type.includes('Bonus') ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                        <span className="text-gray-700 font-medium">{t.type}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 font-medium">{formatVND(t.amount)}</td>
                  <td className="px-6 py-4 text-right text-red-600">{(t.taxDeducted && t.taxDeducted > 0) ? `-${formatVND(t.taxDeducted)}` : '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-brand-primary">{formatVND(t.amount - (t.taxDeducted || 0))}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.status}</span>
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