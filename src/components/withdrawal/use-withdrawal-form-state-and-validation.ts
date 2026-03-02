/**
 * useWithdrawalFormStateAndValidation hook
 * Manages all form state, validation, and submission logic for the withdrawal modal
 */

import { useState } from 'react';
import { formatVND } from '../../utils/format';
import { useTranslation } from '@/hooks';
import { VIETNAM_BANKS } from '../../constants/banks';

interface UseWithdrawalFormProps {
    availableBalance: number;
    onClose: () => void;
}

export function useWithdrawalFormStateAndValidation({
    availableBalance,
    onClose,
}: UseWithdrawalFormProps) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const MIN_WITHDRAWAL = 100000;
    const MAX_WITHDRAWAL = availableBalance;

    const bankOptions = VIETNAM_BANKS.map(bank => ({
        value: bank.name,
        label: `${bank.shortName} - ${bank.name}`,
    }));

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
        if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
    };

    const setQuickAmount = (percentage: number) => {
        const calculatedAmount = Math.floor(availableBalance * percentage);
        setAmount(calculatedAmount.toString());
        if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!amount || parseInt(amount) === 0) {
            newErrors.amount = t('withdrawalmodal.validation.amount_required');
        } else if (parseInt(amount) < MIN_WITHDRAWAL) {
            newErrors.amount = t('withdrawalmodal.validation.min_withdrawal').replace('{amount}', formatVND(MIN_WITHDRAWAL));
        } else if (parseInt(amount) > MAX_WITHDRAWAL) {
            newErrors.amount = t('withdrawalmodal.validation.exceeds_balance');
        }

        if (!bankName.trim()) newErrors.bankName = t('withdrawalmodal.validation.bank_name_required');

        if (!accountNumber.trim()) {
            newErrors.accountNumber = t('withdrawalmodal.validation.account_number_required');
        } else if (!/^\d+$/.test(accountNumber)) {
            newErrors.accountNumber = t('withdrawalmodal.validation.account_number_numeric');
        }

        if (!accountName.trim()) newErrors.accountName = t('withdrawalmodal.validation.account_name_required');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSuccess(true);

        setTimeout(() => {
            setIsSuccess(false);
            resetForm();
            onClose();
        }, 3000);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm();
            setIsSuccess(false);
            onClose();
        }
    };

    return {
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
    };
}
