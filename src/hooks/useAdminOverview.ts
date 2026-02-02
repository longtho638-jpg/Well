import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';

export interface DashboardMetrics {
    totalRevenue: number;
    activePartners: number;
    pendingOrders: number;
    systemHealth: number;
}

export interface AIAction {
    id: string;
    type: 'kyc' | 'withdrawal' | 'fraud' | 'policy';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    aiConfidence: number;
    timestamp: string;
}

const MOCK_ACTIONS: AIAction[] = [
    { id: 'A001', type: 'kyc', title: 'KYC Verification Required', description: 'Partner "Minh Tran" submitted KYC documents', priority: 'high', aiConfidence: 95, timestamp: '2 minutes ago' },
    { id: 'A002', type: 'fraud', title: 'Suspicious Activity Detected', description: '5 transactions from same IP in 10 minutes', priority: 'high', aiConfidence: 87, timestamp: '15 minutes ago' },
];

export function useAdminOverview() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalRevenue: 2450000000,
        activePartners: 245,
        pendingOrders: 0,
        systemHealth: 99.9,
    });
    const [aiActions, setAIActions] = useState<AIAction[]>(MOCK_ACTIONS);
    const [loading, setLoading] = useState(false);

    const fetchMetrics = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            const { count: uCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { data: salesData } = await supabase.from('users').select('total_sales');

            const rev = salesData?.reduce((s, u) => s + (u.total_sales || 0), 0) || 0;

            setMetrics({
                totalRevenue: rev || 2450000000,
                activePartners: uCount || 245,
                pendingOrders: oCount || 0,
                systemHealth: 99.9
            });
        } catch (error) {
            adminLogger.error('Overview fetch failed', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleAction = useCallback((id: string, __decision: "approve" | "reject") => {
        setAIActions(prev => prev.filter(a => a.id !== id));
        // Logic for decision would be here
    }, []);

    const growthData = useMemo(() => [
        { name: 'Mon', revenue: 180000000 },
        { name: 'Tue', revenue: 220000000 },
        { name: 'Wed', revenue: 280000000 },
        { name: 'Thu', revenue: 310000000 },
        { name: 'Fri', revenue: 390000000 },
        { name: 'Sat', revenue: 450000000 },
        { name: 'Sun', revenue: 520000000 },
    ], []);

    return {
        metrics,
        aiActions,
        loading,
        growthData,
        refresh: fetchMetrics,
        handleAction
    };
}
