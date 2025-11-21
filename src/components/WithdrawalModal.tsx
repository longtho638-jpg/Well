import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { formatVND } from '../utils/format';
import { Wallet, AlertTriangle, CheckCircle2, CreditCard, Building2 } from 'lucide-react';

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
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MIN_WITHDRAWAL = 100000; // 100k VND
  const MAX_WITHDRAWAL = availableBalance;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);

    // Clear amount error when user types
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const setQuickAmount = (percentage: number) => {
    const calculatedAmount = Math.floor(availableBalance * percentage);
    setAmount(calculatedAmount.toString());
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseInt(amount) === 0) {
      newErrors.amount = 'Please enter an amount';
    } else if (parseInt(amount) < MIN_WITHDRAWAL) {
      newErrors.amount = `Minimum withdrawal is ${formatVND(MIN_WITHDRAWAL)}`;
    } else if (parseInt(amount) > MAX_WITHDRAWAL) {
      newErrors.amount = `Amount exceeds available balance`;
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Please enter bank name';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Please enter account number';
    } else if (!/^\d+$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must contain only numbers';
    }

    if (!accountName.trim()) {
      newErrors.accountName = 'Please enter account holder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after 3 seconds and close
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setErrors({});
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setErrors({});
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Withdrawal"
      maxWidth="lg"
      showCloseButton={!isSubmitting}
    >
      {isSuccess ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
          <p className="text-gray-600 mb-1">Your withdrawal request has been received.</p>
          <p className="text-sm text-gray-500">Processing time: 1-3 business days</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <div className="bg-gradient-to-r from-brand-primary to-teal-800 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200 text-xs uppercase tracking-wider mb-1">Available Balance</p>
                <p className="text-2xl font-bold">{formatVND(availableBalance)}</p>
              </div>
              <Wallet className="w-8 h-8 text-brand-accent" />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Input
              label="Withdrawal Amount"
              type="text"
              value={amount ? formatVND(parseInt(amount)) : ''}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              error={errors.amount}
              helperText={`Min: ${formatVND(MIN_WITHDRAWAL)} • Max: ${formatVND(MAX_WITHDRAWAL)}`}
              required
              icon={<Wallet className="w-5 h-5" />}
            />

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button
                type="button"
                onClick={() => setQuickAmount(0.25)}
                className="px-3 py-2 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(0.5)}
                className="px-3 py-2 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(0.75)}
                className="px-3 py-2 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(1)}
                className="px-3 py-2 text-xs font-medium text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary" />
              Bank Account Details
            </h3>

            <Input
              label="Bank Name"
              type="text"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
              }}
              placeholder="e.g., Vietcombank, Techcombank"
              error={errors.bankName}
              required
              icon={<Building2 className="w-5 h-5" />}
            />

            <Input
              label="Account Number"
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: '' }));
              }}
              placeholder="Enter account number"
              error={errors.accountNumber}
              required
              icon={<CreditCard className="w-5 h-5" />}
            />

            <Input
              label="Account Holder Name"
              type="text"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                if (errors.accountName) setErrors(prev => ({ ...prev, accountName: '' }));
              }}
              placeholder="Full name as registered"
              error={errors.accountName}
              helperText="Must match your registered name"
              required
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Processing Time</p>
              <p className="text-xs leading-relaxed">
                Withdrawal requests are processed within 1-3 business days. Please ensure your bank details are correct.
              </p>
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Submit Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
