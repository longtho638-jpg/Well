/**
 * WellNexus useOrders Hook
 * Manages state and business logic for administrative order processing.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import { orderService, PendingOrder } from '@/services/orderService';
import { adminLogger } from '@/utils/logger';

export const useOrders = () => {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { showToast } = useToast();

    /**
     * Fetch orders from service
     */
    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await orderService.getPendingOrders();
            setOrders(data);
        } catch (error) {
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    /**
     * Approve order and trigger commissions
     */
    const approveOrder = useCallback(async (orderId: string) => {
        setProcessingId(orderId);
        try {
            await orderService.updateOrderStatus(orderId, 'completed');
            showToast('✅ Order Approved - Commission Triggered!', 'success');
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            showToast('Failed to approve order', 'error');
        } finally {
            setProcessingId(null);
        }
    }, [showToast]);

    /**
     * Reject/Cancel order
     */
    const rejectOrder = useCallback(async (orderId: string) => {
        if (!confirm('Are you sure you want to reject this order?')) return;

        setProcessingId(orderId);
        try {
            await orderService.updateOrderStatus(orderId, 'cancelled');
            showToast('Order rejected', 'info');
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            showToast('Failed to reject order', 'error');
        } finally {
            setProcessingId(null);
        }
    }, [showToast]);

    /**
     * Memoized Statistics
     */
    const stats = useMemo(() => {
        const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
        return {
            count: orders.length,
            totalValue: totalAmount,
            estimatedCommission: totalAmount * 0.25 // Standard 25% commission rate
        };
    }, [orders]);

    return {
        orders,
        loading,
        processingId,
        stats,
        refresh: loadOrders,
        approveOrder,
        rejectOrder
    };
};
