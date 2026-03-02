/**
 * Admin Audit Log (Refactored)
 * Enterprise-grade transparency layer for compliance & security orchestration.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    Search,
    User,
    Clock,
    Settings,
    Shield,
    RefreshCw,
    Activity,
} from 'lucide-react';

// Hooks & Types
import { useAuditLog, AuditLogEntry } from '@/hooks/useAuditLog';
import { useTranslation } from '@/hooks';
import { ACTION_CONFIG, AuditLogTable, AuditLogInspector } from './audit-log-table';

// ============================================================
// MAIN PAGE
// ============================================================

export function AuditLog() {
    const { t } = useTranslation();
    const {
        loading,
        searchQuery,
        setSearchQuery,
        actionFilter,
        setActionFilter,
        adminFilter,
        setAdminFilter,
        filteredLogs,
        uniqueAdmins,
        stats,
        refresh
    } = useAuditLog();

    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    const handleExportCSV = () => {
        const headers = ['Timestamp', 'Admin', 'Action', 'Resource', 'Details'];
        const csv = [
            headers.join(','),
            ...filteredLogs.map(l => [
                new Date(l.timestamp).toLocaleString('vi-VN'),
                l.adminName,
                ACTION_CONFIG[l.action].label,
                l.resourceId,
                JSON.stringify(l.details).replace(/,/g, ';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WellNexus_AuditLog_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10 max-w-7xl mx-auto pb-24"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Shield className="text-[#00575A] w-10 h-10" />
                        {t('auditlog.audit_trail')}</h2>
                    <p className="text-zinc-500 font-medium text-lg">{t('auditlog.immutable_ledger_of_administra')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={refresh} aria-label="Refresh audit log" className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                    >
                        <Download size={20} />
                        {t('auditlog.export_dataset')}</button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Event Total', value: stats.total, icon: Activity, color: 'text-blue-500' },
                    { label: 'Today (UT)', value: stats.today, icon: Clock, color: 'text-emerald-500' },
                    { label: 'Unique Auth', value: uniqueAdmins.length, icon: User, color: 'text-indigo-500' },
                    { label: 'Policy Mods', value: stats.policyChanges, icon: Settings, color: 'text-amber-500' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                            <stat.icon size={16} className={stat.color} />
                            {stat.label}
                        </div>
                        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Suite */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#00575A] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by admin name or resource ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-[2rem] text-sm font-bold placeholder:text-zinc-500 focus:ring-4 focus:ring-[#00575A]/10 outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-4 focus:ring-[#00575A]/10 appearance-none min-w-[180px]"
                        >
                            <option value="all">{t('auditlog.analyze_all_actions')}</option>
                            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        <select
                            value={adminFilter}
                            onChange={(e) => setAdminFilter(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-4 focus:ring-[#00575A]/10 appearance-none min-w-[180px]"
                        >
                            <option value="all">{t('auditlog.all_administrators')}</option>
                            {uniqueAdmins.map(email => (
                                <option key={email} value={email}>{email}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <AuditLogTable filteredLogs={filteredLogs} onSelectLog={setSelectedLog} />

            {/* Detailed Inspection Drawer */}
            <AuditLogInspector selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
        </motion.div>
    );
}

export default AuditLog;
