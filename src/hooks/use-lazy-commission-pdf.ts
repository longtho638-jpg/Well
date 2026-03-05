/**
 * Lazy PDF Report Generator
 * Dynamic import @react-pdf/renderer to reduce initial bundle (saves ~1.6MB)
 */

import { useState, useCallback } from 'react';

export interface CommissionItem {
  date: string;
  type: 'direct' | 'sponsor';
  amount: number;
  orderId?: string;
  fromUser?: string;
}

export interface CommissionReportData {
  userName: string;
  userEmail: string;
  month: string;
  startDate: string;
  endDate: string;
  commissions: CommissionItem[];
  totalDirect: number;
  totalSponsor: number;
  totalEarned: number;
  currentBalance: number;
}

type PDFGenerator = (data: CommissionReportData) => Promise<void>;

export function useLazyCommissionPDF(): {
  generatePDF: PDFGenerator;
  isGenerating: boolean;
  error: string | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async (data: CommissionReportData) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamic imports - code-split PDF bundle
      const [{ pdf }, { createCommissionReportDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/reports/commission-report-pdf-generator'),
      ]);

      // Create and download PDF
      const pdfDocument = createCommissionReportDocument(data);
      const blob = await pdf(pdfDocument).toBlob();

      const monthSlug = data.month.toLowerCase().replace(/\s+/g, '-');
      const filename = `commission-report-${monthSlug}-${Date.now()}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePDF,
    isGenerating,
    error,
  };
}
