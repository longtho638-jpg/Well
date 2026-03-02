/**
 * PDF Commission Report Generator
 * Generates monthly commission breakdown reports using react-pdf
 */

import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { commissionReportStyles as styles } from './commission-report-pdf-stylesheet-definitions';

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
  month: string; // e.g., "January 2026"
  startDate: string;
  endDate: string;
  commissions: CommissionItem[];
  totalDirect: number;
  totalSponsor: number;
  totalEarned: number;
  currentBalance: number;
}

// PDF Document Component
const CommissionReportDocument: React.FC<{ data: CommissionReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Commission Report</Text>
        <Text style={styles.subtitle}>WellNexus Distributor Portal</Text>
        <Text style={styles.subtitle}>
          Period: {data.startDate} - {data.endDate}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distributor Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{data.userName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.userEmail}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Report Month:</Text>
          <Text style={styles.value}>{data.month}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commission Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Direct Sales Commission:</Text>
          <Text style={styles.value}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalDirect)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sponsor Commission (F1):</Text>
          <Text style={styles.value}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalSponsor)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Number of Transactions:</Text>
          <Text style={styles.value}>{data.commissions.length}</Text>
        </View>
      </View>

      {/* Commission Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commission Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
            <Text style={styles.tableHeaderCell}>Type</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Order ID</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>From</Text>
          </View>
          {data.commissions.map((commission, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {new Date(commission.date).toLocaleDateString('vi-VN')}
              </Text>
              <Text style={styles.tableCell}>
                {commission.type === 'direct' ? 'Direct' : 'Sponsor'}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(commission.amount)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {commission.orderId ? `#${commission.orderId.slice(0, 6)}` : '-'}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {commission.fromUser || '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Earned This Month:</Text>
        <Text style={styles.totalValue}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalEarned)}
        </Text>
      </View>

      {/* Current Balance */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Current Available Balance:</Text>
          <Text style={[styles.value, { color: '#10B981' }]}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.currentBalance)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>WellNexus © 2026 - Distributor Portal</Text>
        <Text>Generated on {new Date().toLocaleDateString('vi-VN')} at {new Date().toLocaleTimeString('vi-VN')}</Text>
      </View>
    </Page>
  </Document>
);

// Export function to create the document
export function createCommissionReportDocument(data: CommissionReportData) {
  return <CommissionReportDocument data={data} />;
}

export { CommissionReportDocument };
