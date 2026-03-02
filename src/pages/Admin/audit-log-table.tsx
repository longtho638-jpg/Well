/**
 * Audit Log Table — ledger rendering sub-component
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    ShieldAlert,
    FileText,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    UserPlus,
    Settings,
    DollarSign,
    Shield,
    Activity,
    Fingerprint
} from 'lucide-react';
import { AuditActionType, AuditLogEntry } from '@/hooks/useAuditLog';
import { useTranslation } from '@/hooks';

const X: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export const ACTION_CONFIG: Record<AuditActionType, { icon: React.ElementType; color: string; label: string }> = {
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

export const ActionBadge: React.FC<{ action: AuditActionType }> = ({ action }) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 ${config.color}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

interface AuditLogTableProps {
    filteredLogs: AuditLogEntry[];
    onSelectLog: (log: AuditLogEntry) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ filteredLogs, onSelectLog }) => {
    const { t } = useTranslation();
    return (
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
                                <button onClick={() => onSelectLog(log)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
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
    );
};

interface AuditLogInspectorProps {
    selectedLog: AuditLogEntry | null;
    onClose: () => void;
}

export const AuditLogInspector: React.FC<AuditLogInspectorProps> = ({ selectedLog, onClose }) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {selectedLog && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                    onClick={onClose}
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
                            <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all">
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
                            onClick={onClose}
                            className="w-full bg-[#00575A] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-teal-500/10 hover:bg-[#004447] transition-all"
                        >
                            {t('auditlog.close_inspection')}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
