import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks';
import { useStore } from '../store';
import { Wallet, AlertTriangle, Info } from 'lucide-react';
import { WithdrawalForm } from '../components/withdrawal/withdrawal-form';
import { WithdrawalHistory } from '../components/withdrawal/withdrawal-history';
import { formatVND } from '../utils/format';

const WithdrawalPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // Dispatch custom event for history component
    window.dispatchEvent(new Event('withdrawal-created'));
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-400" />
            {t('nav.withdrawal') || 'Withdrawal'}
          </h1>
          <p className="text-zinc-400 mt-1">
            Securely withdraw your earnings to your bank account
          </p>
        </div>
      </div>

      {/* Available Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 shadow-2xl shadow-emerald-500/20"
      >
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-emerald-100 font-medium mb-1 uppercase tracking-wider text-xs">
              Available Balance
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {formatVND(user?.shopBalance || 0)}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-emerald-100/80 text-sm">
              <Info className="w-4 h-4" />
              <span>Minimum withdrawal: 2,000,000 đ</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 max-w-md">
             <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Withdrawal Policy</p>
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    Withdrawals are processed within 24-48 hours. Please ensure your bank account name matches your KYC identity.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7">
          <WithdrawalForm onSuccess={handleSuccess} />
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-5 h-full">
          <WithdrawalHistory key={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;
