/**
 * useWalletTransactionFilterAndLabelTranslator hook
 * Manages currency filter state and provides i18n label helpers
 * for transaction type and status in the WalletTransactionHistoryTable component
 */

import { useState } from 'react';
import { useTranslation } from '@/hooks';

export type WalletCurrencyFilter = 'all' | 'SHOP' | 'GROW';

export function useWalletTransactionFilterAndLabelTranslator() {
    const { t, i18n } = useTranslation();
    const [filter, setFilter] = useState<WalletCurrencyFilter>('all');

    const getTransactionType = (type: string): string => {
        switch (type) {
            case 'Direct Sale': return t('wallet.transactions.types.directSale');
            case 'Team Volume Bonus': return t('wallet.transactions.types.teamBonus');
            case 'Withdrawal': return t('wallet.transactions.types.withdrawal');
            default: return type;
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'pending': return t('wallet.transactions.statusValues.pending');
            case 'completed': return t('wallet.transactions.statusValues.completed');
            case 'failed': return t('wallet.transactions.statusValues.failed');
            case 'cancelled': return t('wallet.transactions.statusValues.cancelled');
            default: return status;
        }
    };

    return { filter, setFilter, getTransactionType, getStatusText, i18n };
}
