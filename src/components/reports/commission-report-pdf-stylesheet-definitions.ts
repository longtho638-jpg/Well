/**
 * commission-report-pdf-stylesheet-definitions
 * StyleSheet definitions for the commission report PDF document.
 * Extracted to keep the PDF generator component under 200 LOC.
 */

import { StyleSheet } from '@react-pdf/renderer';

export const commissionReportStyles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2 solid #1E293B',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 3,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
        borderBottom: '1 solid #E2E8F0',
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottom: '1 solid #F1F5F9',
    },
    label: {
        fontSize: 10,
        color: '#475569',
        flex: 1,
    },
    value: {
        fontSize: 10,
        color: '#0F172A',
        fontWeight: 'bold',
        textAlign: 'right',
        flex: 1,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderBottom: '2 solid #CBD5E1',
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
        flex: 1,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1 solid #E2E8F0',
    },
    tableCell: {
        fontSize: 9,
        color: '#475569',
        flex: 1,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F59E0B20',
        padding: 10,
        marginTop: 10,
        borderRadius: 4,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400E',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#D97706',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 8,
        borderTop: '1 solid #E2E8F0',
        paddingTop: 10,
    },
});
