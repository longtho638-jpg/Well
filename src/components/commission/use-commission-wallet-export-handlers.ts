/**
 * useCommissionWalletExportHandlers hook
 * Provides CSV and PDF export logic for the CommissionWallet component
 */

import { useMemo } from 'react';
import { useStore } from '../../store';
import { useCommissionPDFReport } from '@/hooks/use-commission-pdf-report-generator';
import { calculatePIT } from '../../utils/tax';

export function useCommissionWalletExportHandlers() {
    const { transactions, user } = useStore();
    const { generatePDF, isGenerating } = useCommissionPDFReport();

    const processedTransactions = useMemo(() => transactions.map(tx => {
        const { taxAmount, isTaxable } = calculatePIT(tx.amount);
        return { ...tx, taxDeducted: taxAmount, isTaxable };
    }), [transactions]);

    const totalGross = useMemo(
        () => processedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        [processedTransactions]
    );
    const totalTax = useMemo(
        () => processedTransactions.reduce((sum, tx) => sum + tx.taxDeducted, 0),
        [processedTransactions]
    );
    const totalNet = totalGross - totalTax;

    const handleExportCSV = () => {
        const headers = ['Date', 'Ref ID', 'Type', 'Gross Amount (VND)', 'Tax Deducted (VND)', 'Net Received (VND)', 'Status'];
        const rows = processedTransactions.map(t => [
            t.date, t.id, t.type, t.amount, t.taxDeducted || 0, t.amount - (t.taxDeducted || 0), t.status,
        ]);
        rows.push([]);
        rows.push(['SUMMARY', '', '', totalGross, totalTax, totalNet, '']);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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

    const handleExportPDF = async () => {
        const now = new Date();
        const monthName = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

        const commissions = processedTransactions.map(tx => ({
            date: tx.date,
            type: (tx.type.toLowerCase().includes('direct') ? 'direct' : 'sponsor') as 'direct' | 'sponsor',
            amount: tx.amount,
            orderId: tx.id,
            fromUser: tx.type,
        }));

        const totalDirect = commissions.filter(c => c.type === 'direct').reduce((sum, c) => sum + c.amount, 0);
        const totalSponsor = commissions.filter(c => c.type === 'sponsor').reduce((sum, c) => sum + c.amount, 0);

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
        } catch {
            // non-critical
        }
    };

    return {
        processedTransactions,
        totalGross,
        totalTax,
        totalNet,
        isGenerating,
        handleExportCSV,
        handleExportPDF,
    };
}
