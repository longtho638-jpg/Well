import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks';
import { Loader2, ArrowRight, Wallet, AlertCircle, ShieldCheck } from 'lucide-react';
import { BankSelect } from './bank-select';
import { withdrawalService } from '../../services/withdrawal-service';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store';
import { buildWithdrawalSchema, MIN_WITHDRAWAL, WithdrawalFormData } from './withdrawal-form-zod-schema-and-min-amount';

interface WithdrawalFormProps {
  onSuccess?: () => void;
}

export const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { user, fetchUserFromDB } = useStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const schema = useMemo(() => buildWithdrawalSchema(user?.pendingCashback || 0, t), [user?.pendingCashback, t]);
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<WithdrawalFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: MIN_WITHDRAWAL,
      bankName: '',
      accountNumber: '',
      accountName: user?.name?.toUpperCase() || '',
    },
  });

  const onSubmit = async (data: WithdrawalFormData) => {
    setLoading(true);
    try {
      await withdrawalService.createWithdrawalRequest(data.amount, {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });

      showToast(t('withdrawal.successMessage') || 'Withdrawal request submitted successfully', 'success');

      // Refresh user balance
      await fetchUserFromDB();

      if (onSuccess) onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : (t('withdrawal.errorMessage') || 'Failed to submit withdrawal request');
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    setValue('amount', user?.pendingCashback || 0);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('withdrawal.requestTitle') || 'Request Withdrawal'}</h3>
            <p className="text-xs text-zinc-400">{t('withdrawal.requestSubtitle') || 'Secure transfer to your bank account'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Amount Field */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-400 mb-1.5">
              {t('withdrawal.amount') || 'Amount'} (VND)
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                {...control.register('amount', { valueAsNumber: true })}
                className={`w-full bg-zinc-900/50 border rounded-xl py-3 pl-4 pr-20 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                  errors.amount ? 'border-red-500/50' : 'border-white/10'
                }`}
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="absolute right-2 top-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-colors"
              >
                MAX
              </button>
            </div>
            {errors.amount ? (
              <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500 flex justify-between">
                <span>{t('withdrawal.minLabel')}: {new Intl.NumberFormat('vi-VN').format(MIN_WITHDRAWAL)} đ</span>
                <span>{t('withdrawal.availableLabel')}: {new Intl.NumberFormat('vi-VN').format(user?.pendingCashback || 0)} đ</span>
              </p>
            )}
          </div>

          {/* Bank Selection */}
          <Controller
            name="bankName"
            control={control}
            render={({ field }) => (
              <BankSelect
                value={field.value}
                onChange={field.onChange}
                error={errors.bankName?.message}
                id="bankName"
              />
            )}
          />

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-zinc-400 mb-1.5">
              {t('withdrawal.accountNumber') || 'Account Number'}
            </label>
            <input
              id="accountNumber"
              type="text"
              {...control.register('accountNumber')}
              placeholder="e.g. 1903..."
              className={`w-full bg-zinc-900/50 border rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                errors.accountNumber ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.accountNumber && (
              <p className="mt-1 text-xs text-red-400 font-medium">
                {errors.accountNumber.message}
              </p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-zinc-400 mb-1.5">
              {t('withdrawal.accountName') || 'Account Holder Name'}
            </label>
            <input
              id="accountName"
              type="text"
              {...control.register('accountName')}
              className={`w-full bg-zinc-900/50 border rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all uppercase ${
                errors.accountName ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.accountName && (
              <p className="mt-1 text-xs text-red-400 font-medium">
                {errors.accountName.message}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              {t('withdrawal.nameMatchNote') || 'Name must match your KYC document'}
            </p>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (user?.pendingCashback || 0) < MIN_WITHDRAWAL}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              loading || (user?.pendingCashback || 0) < MIN_WITHDRAWAL
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-emerald-500/25'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('withdrawal.submitButton') || 'Submit Withdrawal'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};
