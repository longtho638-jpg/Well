/**
 * PDF Report Generation Hook
 * Generate and download PDF commission reports
 */

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { createCommissionReportDocument, type CommissionReportData } from '@/components/reports/commission-report-pdf-generator';

export function useCommissionPDFReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (data: CommissionReportData): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Create PDF blob
      const pdfDocument = createCommissionReportDocument(data);
      const blob = await pdf(pdfDocument).toBlob();

      // Generate filename
      const monthSlug = data.month.toLowerCase().replace(/\s+/g, '-');
      const filename = `commission-report-${monthSlug}-${Date.now()}.pdf`;

      // Create download link
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
      const error = err as Error;
      setError(error.message || 'Failed to generate PDF');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    error,
  };
}
