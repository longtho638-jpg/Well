import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { formatVND } from '../utils/format';
import { Wallet, AlertTriangle, CheckCircle2, CreditCard, Building2 } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useWithdrawalFormStateAndValidation } from './withdrawal/use-withdrawal-form-state-and-validation';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
}) => {
    const { t } = useTranslation();
    const {
        amount,
        bankName,
        setBankName,
        accountNumber,
        setAccountNumber,
        accountName,
        setAccountName,
        isSubmitting,
        isSuccess,
        errors,
        setErrors,
        bankOptions,
        MIN_WITHDRAWAL,
        MAX_WITHDRAWAL,
        handleAmountChange,
        setQuickAmount,
        handleSubmit,
        handleClose,
    } = useWithdrawalFormStateAndValidation({ availableBalance, onClose });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('withdrawal.requestTitle')}
      maxWidth="lg"
      showCloseButton={!isSubmitting}
    >
      {isSuccess ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">{t('withdrawalmodal.request_submitted')}</h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-1">{t('withdrawalmodal.your_withdrawal_request_has_be')}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-500">{t('withdrawalmodal.processing_time_1_3_business')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <div className="bg-gradient-to-r from-brand-primary to-teal-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">{t('withdrawalmodal.available_balance')}</p>
                <p className="text-2xl font-bold">{formatVND(availableBalance)}</p>
              </div>
              <Wallet className="w-8 h-8 text-brand-accent dark:text-yellow-400" />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Input
              label={t('withdrawal.amount')}
              type="text"
              value={amount ? formatVND(parseInt(amount)) : ''}
              onChange={handleAmountChange}
              placeholder={t('withdrawalmodal.enter_amount')}
              error={errors.amount}
              helperText={`${t('withdrawal.minLabel')}: ${formatVND(MIN_WITHDRAWAL)} • Max: ${formatVND(MAX_WITHDRAWAL)}`}
              required
              icon={<Wallet className="w-5 h-5" />}
            />

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button
                type="button"
                onClick={() => setQuickAmount(0.25)}
                className="px-3 py-2 text-xs font-medium text-brand-primary dark:text-teal-400 border border-brand-primary dark:border-teal-400 rounded-lg hover:bg-brand-primary hover:text-white dark:hover:bg-teal-400 dark:hover:text-slate-900 transition-colors"
              >
                {t('withdrawalmodal.25')}</button>
              <button
                type="button"
                onClick={() => setQuickAmount(0.5)}
                className="px-3 py-2 text-xs font-medium text-brand-primary dark:text-teal-400 border border-brand-primary dark:border-teal-400 rounded-lg hover:bg-brand-primary hover:text-white dark:hover:bg-teal-400 dark:hover:text-slate-900 transition-colors"
              >
                {t('withdrawalmodal.50')}</button>
              <button
                type="button"
                onClick={() => setQuickAmount(0.75)}
                className="px-3 py-2 text-xs font-medium text-brand-primary dark:text-teal-400 border border-brand-primary dark:border-teal-400 rounded-lg hover:bg-brand-primary hover:text-white dark:hover:bg-teal-400 dark:hover:text-slate-900 transition-colors"
              >
                {t('withdrawalmodal.75')}</button>
              <button
                type="button"
                onClick={() => setQuickAmount(1)}
                className="px-3 py-2 text-xs font-medium text-brand-primary dark:text-teal-400 border border-brand-primary dark:border-teal-400 rounded-lg hover:bg-brand-primary hover:text-white dark:hover:bg-teal-400 dark:hover:text-slate-900 transition-colors"
              >
                {t('withdrawalmodal.max')}</button>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary dark:text-teal-400" />
              {t('withdrawalmodal.bank_account_details')}</h3>

            <Select
              label={t('withdrawal.bankName')}
              value={bankName}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setBankName(e.target.value);
                if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
              }}
              options={bankOptions}
              error={errors.bankName}
              required
              icon={<Building2 className="w-5 h-5" />}
            />

            <Input
              label={t('withdrawal.accountNumber')}
              type="text"
              value={accountNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAccountNumber(e.target.value);
                if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: '' }));
              }}
              placeholder={t('withdrawalmodal.account_number_placeholder')}
              error={errors.accountNumber}
              required
              icon={<CreditCard className="w-5 h-5" />}
            />

            <Input
              label={t('withdrawal.accountName')}
              type="text"
              value={accountName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAccountName(e.target.value);
                if (errors.accountName) setErrors(prev => ({ ...prev, accountName: '' }));
              }}
              placeholder={t('withdrawalmodal.account_name_placeholder')}
              error={errors.accountName}
              helperText={t('withdrawal.nameMatchNote')}
              required
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">{t('withdrawalmodal.processing_time')}</p>
              <p className="text-xs leading-relaxed">
                {t('withdrawalmodal.withdrawal_requests_are_proces')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('withdrawalmodal.cancel')}</Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {t('withdrawalmodal.submit_request')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
