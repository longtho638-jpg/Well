/**
 * WellNexus Partner CRM Hook (Max Level)
 * High-performance state orchestration for ecosystem node management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { partnerService, Partner } from '@/services/partnerService';
import { adminLogger } from '@/utils/logger';
import { useToast } from '@/components/ui/Toast';

export type { Partner };

export type PartnerFilterStatus = 'all' | Partner['status'];

export const usePartners = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<PartnerFilterStatus>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const { showToast } = useToast();

    /**
     * Node Synchronization Payload
     */
    const fetchPartners = useCallback(async () => {
        setLoading(true);
        try {
            const data = await partnerService.fetchPartners();
            setPartners(data);
            adminLogger.info(`CRM: Synced ${data.length} identity nodes`);
        } catch (error) {
            showToast('Ecosystem node synchronization failed', 'error');
            adminLogger.error('Critical: Partner sync failure', error);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    /**
     * Filtered Recon Dashboard (Multi-tier memoization)
     */
    const filteredPartners = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return partners.filter((partner) => {
            const matchesSearch = !query ||
                partner.name.toLowerCase().includes(query) ||
                partner.email.toLowerCase().includes(query);

            const matchesFilter = selectedFilter === 'all' || partner.status === selectedFilter;

            return matchesSearch && matchesFilter;
        });
    }, [partners, searchQuery, selectedFilter]);

    /**
     * Identity Node Selection Orchestration
     */
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            const allVisibleIds = filteredPartners.map(p => p.id);
            const allMatch = allVisibleIds.length > 0 && allVisibleIds.every(id => prev.has(id));

            if (allMatch) {
                const next = new Set(prev);
                allVisibleIds.forEach(id => next.delete(id));
                return next;
            } else {
                return new Set([...Array.from(prev), ...allVisibleIds]);
            }
        });
    }, [filteredPartners]);

    /**
     * Strategic Bulk Ops Committer
     */
    const handleBulkAction = useCallback(async (action: 'activate' | 'ban' | 'export') => {
        if (selectedIds.size === 0) {
            showToast('No identity nodes selected for mission', 'info');
            return;
        }

        if (action === 'export') {
            const selectedPartners = partners.filter(p => selectedIds.has(p.id));
            const csv = [
                ['Full Name', 'Email', 'Rank', 'Total Sales', 'Points', 'Status'].join(','),
                ...selectedPartners.map(p => [
                    `"${p.name}"`,
                    `"${p.email}"`,
                    `"${p.rank}"`,
                    p.totalSales,
                    p.pointBalance,
                    `"${p.status}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `WellNexus_CRM_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            showToast(`Intelligence report exported for ${selectedIds.size} nodes`, 'success');
            setSelectedIds(new Set());
            return;
        }

        setBulkActionLoading(true);
        try {
            await partnerService.bulkUpdateStatus(
                Array.from(selectedIds),
                action === 'ban' ? 'Banned' : 'Active'
            );

            showToast(`Bulk authorization verified for ${selectedIds.size} nodes`, 'success');
            setSelectedIds(new Set());
            await fetchPartners();
        } catch (error) {
            adminLogger.error('Bulk: Mission execution failure', error);
            showToast('Bulk operation failed validation', 'error');
        } finally {
            setBulkActionLoading(false);
        }
    }, [partners, selectedIds, showToast, fetchPartners]);

    /**
     * Individual Node Data Integrity
     */
    const updatePartner = useCallback(async (id: string, updates: Partial<Partner>) => {
        try {
            setPartners(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            await partnerService.updatePartner(id, updates);
            showToast('Identity node synchronized and persistent', 'success');
        } catch (error) {
            adminLogger.error(`Update: Node ${id} persistence failure`, error);
            showToast('Data persistence failure', 'error');
            fetchPartners(); // Rollback to source of truth
        }
    }, [showToast, fetchPartners]);

    return {
        partners,
        loading,
        searchQuery,
        setSearchQuery,
        selectedFilter,
        setSelectedFilter,
        selectedIds,
        setSelectedIds,
        bulkActionLoading,
        fetchPartners,
        filteredPartners,
        toggleSelect,
        toggleSelectAll,
        handleBulkAction,
        updatePartner
    };
};
