/**
 * Admin Audit Log (Refactored)
 * Enterprise-grade transparency layer for compliance & security orchestration.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    Search,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    UserPlus,
    Settings,
    DollarSign,
    Shield,
    Eye,
    RefreshCw,
    ShieldAlert,
    Activity,
    Fingerprint
} from 'lucide-react';

// Hooks & Types
import { useAuditLog, AuditActionType, AuditLogEntry } from '@/hooks/useAuditLog';
import { useTranslation } from '@/hooks';

// ============================================================
// CONFIGURATION
// ============================================================

const ACTION_CONFIG: Record<AuditActionType, { icon: React.ElementType; color: string; label: string }> = {
    partner_approved: { icon: UserPlus, color: 'text-emerald-500', label: 'Partner Approved' },
    partner_rejected: { icon: XCircle, color: 'text-rose-500', label: 'Partner Rejected' },
    partner_banned: { icon: ShieldAlert, color: 'text-rose-600', label: 'Security Ban' },
    order_approved: { icon: CheckCircle, color: 'text-emerald-500', label: 'Order Approved' },
    order_rejected: { icon: XCircle, color: 'text-rose-500', label: 'Order Rejected' },
    payout_processed: { icon: DollarSign, color: 'text-indigo-500', label: 'Payout Processed' },
    policy_updated: { icon: Activity, color: 'text-amber-500', label: 'Strategic Update' },
    product_created: { icon: FileText, color: 'text-emerald-500', label: 'SKU Created' },
    product_updated: { icon: Edit, color: 'text-blue-500', label: 'SKU Updated' },
    product_deleted: { icon: Trash2, color: 'text-rose-500', label: 'SKU Deleted' },
    config_changed: { icon: Settings, color: 'text-amber-500', label: 'Config Mutation' },
    admin_login: { icon: Fingerprint, color: 'text-blue-500', label: 'Auth Access' },
    admin_logout: { icon: Fingerprint, color: 'text-zinc-500', label: 'Auth Terminated' },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const ActionBadge: React.FC<{ action: AuditActionType }> = ({ action }) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 ${config.color}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

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
                    <button onClick={refresh} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl shadow-zinc-500/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('auditlog.timeline')}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('auditlog.operator')}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('auditlog.classification')}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('auditlog.resource_node')}</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">{t('auditlog.tracing')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5 font-bold">
                        {filteredLogs.map((log) => (
                            <motion.tr key={log.id} layout className="group hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                                            {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-[11px] font-black border border-zinc-200 dark:border-white/5">
                                            {log.adminName.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-zinc-900 dark:text-zinc-100">{log.adminName}</span>
                                            <span className="text-[10px] text-zinc-400 font-medium">{log.adminEmail}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <ActionBadge action={log.action} />
                                </td>
                                <td className="px-8 py-6">
                                    <span className="font-mono text-[11px] text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        {log.resourceId}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button onClick={() => setSelectedLog(log)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <div className="py-24 text-center">
                        <ShieldAlert className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">{t('auditlog.no_telemetry_signals_detected')}</p>
                    </div>
                )}
            </div>

            {/* Detailed Inspection Drawer */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                        onClick={() => setSelectedLog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <Shield size={120} className="text-white" />
                            </div>

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase">{t('auditlog.event_inspection')}</h3>
                                    <p className="text-zinc-500 font-medium mt-1">{t('auditlog.detailed_forensics_for_trace')}{selectedLog.id}</p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-4 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 relative z-10 mb-10">
                                <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('auditlog.temporal_signature')}</p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-zinc-100 font-bold">{new Date(selectedLog.timestamp).toLocaleString('vi-VN')}</p>
                                        <p className="text-xs text-zinc-500 uppercase tracking-tighter">{t('auditlog.utc_synchronization_active')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('auditlog.network_origin')}</p>
                                    <div className="space-y-1" title={selectedLog.userAgent}>
                                        <p className="text-sm text-zinc-100 font-mono font-bold">{selectedLog.ipAddress}</p>
                                        <p className="text-xs text-zinc-500 uppercase tracking-tighter truncate max-w-[180px]">{t('auditlog.browser_api_gateway_node')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10 mb-10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t('auditlog.payload_metadata')}</p>
                                <pre className="bg-zinc-950/80 rounded-[2rem] p-8 border border-white/5 text-emerald-500 font-mono text-xs overflow-x-auto shadow-inner">
                                    {JSON.stringify(selectedLog.details, null, 4)}
                                </pre>
                            </div>

                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full bg-[#00575A] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-teal-500/10 hover:bg-[#004447] transition-all"
                            >
                                {t('auditlog.close_inspection')}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const X: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export default AuditLog;
