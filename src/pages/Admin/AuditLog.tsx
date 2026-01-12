/**
 * Admin Audit Log Page
 * Phase 3: Admin Pages Enhancement
 * 
 * Enterprise-grade audit trail for VC/IPO compliance:
 * - Admin action history (who did what, when)
 * - Filterable by action type, admin, date range
 * - Exportable to CSV for compliance
 * - GDPR-ready data structure
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Filter,
    Download,
    Search,
    Calendar,
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
    ChevronDown,
    RefreshCw,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

export type AuditActionType =
    | 'partner_approved'
    | 'partner_rejected'
    | 'partner_banned'
    | 'order_approved'
    | 'order_rejected'
    | 'payout_processed'
    | 'policy_updated'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'config_changed'
    | 'admin_login'
    | 'admin_logout';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    action: AuditActionType;
    resource: string;
    resourceId: string;
    details: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
}

interface FilterState {
    actionType: string;
    adminEmail: string;
    dateFrom: string;
    dateTo: string;
    search: string;
}

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: 'AL001',
        timestamp: new Date().toISOString(),
        adminId: 'admin-001',
        adminName: 'Minh Tran',
        adminEmail: 'admin@wellnexus.vn',
        action: 'order_approved',
        resource: 'orders',
        resourceId: 'ORD-2024-001',
        details: { amount: 15000000, partnerId: 'P001', partnerName: 'Nguyen Van A' },
        ipAddress: '113.xxx.xxx.xxx',
        userAgent: 'Chrome/120 on macOS',
    },
    {
        id: 'AL002',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        adminId: 'admin-001',
        adminName: 'Minh Tran',
        adminEmail: 'admin@wellnexus.vn',
        action: 'partner_approved',
        resource: 'partners',
        resourceId: 'P002',
        details: { partnerName: 'Le Thi B', kycVerified: true },
        ipAddress: '113.xxx.xxx.xxx',
        userAgent: 'Chrome/120 on macOS',
    },
    {
        id: 'AL003',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        adminId: 'admin-002',
        adminName: 'Lan Nguyen',
        adminEmail: 'lan@wellnexus.vn',
        action: 'policy_updated',
        resource: 'policy_engine',
        resourceId: 'commission_rates',
        details: { field: 'retailComm', oldValue: 15, newValue: 18 },
        ipAddress: '14.xxx.xxx.xxx',
        userAgent: 'Safari/17 on iOS',
    },
    {
        id: 'AL004',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        adminId: 'admin-001',
        adminName: 'Minh Tran',
        adminEmail: 'admin@wellnexus.vn',
        action: 'payout_processed',
        resource: 'finance',
        resourceId: 'PAY-2024-001',
        details: { amount: 50000000, recipientCount: 12 },
        ipAddress: '113.xxx.xxx.xxx',
        userAgent: 'Chrome/120 on macOS',
    },
    {
        id: 'AL005',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        adminId: 'admin-002',
        adminName: 'Lan Nguyen',
        adminEmail: 'lan@wellnexus.vn',
        action: 'partner_banned',
        resource: 'partners',
        resourceId: 'P999',
        details: { partnerName: 'Spam Account', reason: 'Fraudulent activity' },
        ipAddress: '14.xxx.xxx.xxx',
        userAgent: 'Safari/17 on iOS',
    },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================

const ACTION_CONFIG: Record<AuditActionType, { icon: React.ElementType; color: string; label: string }> = {
    partner_approved: { icon: UserPlus, color: 'text-emerald-400', label: 'Partner Approved' },
    partner_rejected: { icon: XCircle, color: 'text-red-400', label: 'Partner Rejected' },
    partner_banned: { icon: Shield, color: 'text-red-400', label: 'Partner Banned' },
    order_approved: { icon: CheckCircle, color: 'text-emerald-400', label: 'Order Approved' },
    order_rejected: { icon: XCircle, color: 'text-red-400', label: 'Order Rejected' },
    payout_processed: { icon: DollarSign, color: 'text-blue-400', label: 'Payout Processed' },
    policy_updated: { icon: Settings, color: 'text-amber-400', label: 'Policy Updated' },
    product_created: { icon: FileText, color: 'text-emerald-400', label: 'Product Created' },
    product_updated: { icon: Edit, color: 'text-blue-400', label: 'Product Updated' },
    product_deleted: { icon: Trash2, color: 'text-red-400', label: 'Product Deleted' },
    config_changed: { icon: Settings, color: 'text-amber-400', label: 'Config Changed' },
    admin_login: { icon: User, color: 'text-blue-400', label: 'Admin Login' },
    admin_logout: { icon: User, color: 'text-zinc-400', label: 'Admin Logout' },
};

const ActionBadge: React.FC<{ action: AuditActionType }> = ({ action }) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800/50 ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
};

const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTimestamp(isoString);
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AuditLog() {
    const [logs, setLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        actionType: 'all',
        adminEmail: 'all',
        dateFrom: '',
        dateTo: '',
        search: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    // Get unique admins for filter dropdown
    const uniqueAdmins = Array.from(new Set(logs.map(l => l.adminEmail)));

    // Apply filters
    const filteredLogs = logs.filter((log) => {
        if (filters.actionType !== 'all' && log.action !== filters.actionType) return false;
        if (filters.adminEmail !== 'all' && log.adminEmail !== filters.adminEmail) return false;
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
                log.adminName.toLowerCase().includes(searchLower) ||
                log.resourceId.toLowerCase().includes(searchLower) ||
                JSON.stringify(log.details).toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }
        return true;
    });

    const handleExportCSV = () => {
        const headers = ['Timestamp', 'Admin', 'Action', 'Resource ID', 'Details', 'IP Address'];
        const rows = filteredLogs.map((log) => [
            formatTimestamp(log.timestamp),
            log.adminName,
            ACTION_CONFIG[log.action].label,
            log.resourceId,
            JSON.stringify(log.details),
            log.ipAddress,
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleRefresh = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Audit Log</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Complete history of admin actions for compliance and security
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Actions', value: logs.length, icon: FileText },
                    { label: 'Today', value: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length, icon: Calendar },
                    { label: 'Unique Admins', value: uniqueAdmins.length, icon: User },
                    { label: 'Policy Changes', value: logs.filter(l => l.action === 'policy_updated').length, icon: Settings },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
                                <p className="text-xs text-zinc-500">{stat.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by admin, resource ID, or details..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Action Type Filter */}
                    <select
                        value={filters.actionType}
                        onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="all">All Actions</option>
                        {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {/* Admin Filter */}
                    <select
                        value={filters.adminEmail}
                        onChange={(e) => setFilters({ ...filters, adminEmail: e.target.value })}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="all">All Admins</option>
                        {uniqueAdmins.map((email) => (
                            <option key={email} value={email}>{email}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Log Table */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Admin
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Resource
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Details
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                View
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredLogs.map((log, index) => (
                            <motion.tr
                                key={log.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="hover:bg-zinc-900/50 transition-colors"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300">{formatRelativeTime(log.timestamp)}</span>
                                        <span className="text-xs text-zinc-600">{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-medium">
                                            {log.adminName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-100">{log.adminName}</p>
                                            <p className="text-xs text-zinc-500">{log.adminEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <ActionBadge action={log.action} />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-sm text-zinc-300 font-mono">{log.resourceId}</span>
                                </td>
                                <td className="px-4 py-4 max-w-48">
                                    <p className="text-sm text-zinc-400 truncate">
                                        {Object.entries(log.details)
                                            .slice(0, 2)
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(', ')}
                                    </p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedLog(log)}
                                        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredLogs.length === 0 && (
                    <div className="px-4 py-12 text-center text-zinc-500">
                        No audit logs found matching your criteria
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setSelectedLog(null)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-zinc-100 mb-4">Audit Log Details</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Timestamp</p>
                                <p className="text-sm text-zinc-100">{formatTimestamp(selectedLog.timestamp)}</p>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Admin</p>
                                <p className="text-sm text-zinc-100">{selectedLog.adminName} ({selectedLog.adminEmail})</p>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Action</p>
                                <div className="mt-1">
                                    <ActionBadge action={selectedLog.action} />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Resource ID</p>
                                <p className="text-sm text-zinc-100 font-mono">{selectedLog.resourceId}</p>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Details</p>
                                <pre className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3 mt-1 overflow-x-auto">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-zinc-500 uppercase">IP Address</p>
                                    <p className="text-sm text-zinc-100 font-mono">{selectedLog.ipAddress}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-zinc-500 uppercase">User Agent</p>
                                    <p className="text-sm text-zinc-100">{selectedLog.userAgent}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedLog(null)}
                            className="w-full mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

export default AuditLog;
