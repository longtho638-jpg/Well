import { useState, useCallback, useMemo } from 'react';

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

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    { id: 'AL001', timestamp: new Date().toISOString(), adminId: 'admin-001', adminName: 'Minh Tran', adminEmail: 'admin@wellnexus.vn', action: 'order_approved', resource: 'orders', resourceId: 'ORD-2024-001', details: { amount: 15000000, partnerId: 'P001', partnerName: 'Nguyen Van A' }, ipAddress: '113.xxx.xxx.xxx', userAgent: 'Chrome/120 on macOS' },
    { id: 'AL002', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), adminId: 'admin-001', adminName: 'Minh Tran', adminEmail: 'admin@wellnexus.vn', action: 'partner_approved', resource: 'partners', resourceId: 'P002', details: { partnerName: 'Le Thi B', kycVerified: true }, ipAddress: '113.xxx.xxx.xxx', userAgent: 'Chrome/120 on macOS' },
    { id: 'AL003', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), adminId: 'admin-002', adminName: 'Lan Nguyen', adminEmail: 'lan@wellnexus.vn', action: 'policy_updated', resource: 'policy_engine', resourceId: 'commission_rates', details: { field: 'retailComm', oldValue: 15, newValue: 18 }, ipAddress: '14.xxx.xxx.xxx', userAgent: 'Safari/17 on iOS' },
];

export function useAuditLog() {
    const [logs, setLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        // Sync logic could be added here
        await new Promise(r => setTimeout(r, 600));
        setLogs(MOCK_AUDIT_LOGS);
        setLoading(false);
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = !searchQuery ||
                log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesAction = actionFilter === 'all' || log.action === actionFilter;
            const matchesAdmin = adminFilter === 'all' || log.adminEmail === adminFilter;
            return matchesSearch && matchesAction && matchesAdmin;
        });
    }, [logs, searchQuery, actionFilter, adminFilter]);

    const uniqueAdmins = useMemo(() => Array.from(new Set(logs.map(l => l.adminEmail))), [logs]);

    const stats = useMemo(() => ({
        total: logs.length,
        today: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
        policyChanges: logs.filter(l => l.action === 'policy_updated').length
    }), [logs]);

    return {
        logs,
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
        refresh: fetchLogs
    };
}
