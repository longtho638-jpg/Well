import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Eye, AlertTriangle,
    DollarSign, User, Calendar, Image as ImageIcon,
    Loader2, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { useToast } from '@/components/ui/Toast';
import { adminLogger } from '@/utils/logger';

interface PendingOrder {
    id: string;
    user_id: string;
    amount: number;
    created_at: string;
    payment_proof_url?: string;
    currency: string;
    user: {
        name: string;
        email: string;
    };
}

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { user } = useStore();
    const { showToast } = useToast();
    // NOTE: Security check removed - AdminRoute.tsx already protects this route

    // Fetch pending orders
    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('id, user_id, amount, created_at, payment_proof_url, currency, status, type')
                .eq('status', 'pending')
                .eq('type', 'sale')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch user details for each order
            const ordersWithUsers = await Promise.all(
                (data || []).map(async (order) => {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('name, email')
                        .eq('id', order.user_id)
                        .single();

                    return {
                        ...order,
                        user: userData || { name: 'Unknown', email: '' }
                    };
                })
            );

            setOrders(ordersWithUsers);
        } catch (error) {
            adminLogger.error('Error loading orders', error);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const handleApprove = async (orderId: string) => {
        setProcessingId(orderId);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'completed' })
                .eq('id', orderId);

            if (error) throw error;

            showToast('✅ Order Approved - Commission Triggered!', 'success');

            // Remove from list
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            adminLogger.error('Approve error', error);
            showToast('Failed to approve order', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (orderId: string) => {
        if (!confirm('Are you sure you want to reject this order?')) return;

        setProcessingId(orderId);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (error) throw error;

            showToast('Order rejected', 'info');

            // Remove from list
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            adminLogger.error('Reject error', error);
            showToast('Failed to reject order', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <DollarSign className="text-[#FFBF00]" size={32} />
                        Nút Bấm Tiền Về
                    </h1>
                    <p className="text-slate-400 mt-1">Duyệt đơn hàng & Kích hoạt hoa hồng</p>
                </div>
                <button
                    onClick={fetchPendingOrders}
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#00575A] text-white px-4 py-2 rounded-lg hover:bg-[#00575A]/80 transition-all"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
                    <div className="text-sm text-amber-200">Đang chờ duyệt</div>
                    <div className="text-3xl font-bold text-amber-400 mt-1">{orders.length}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-sm text-blue-200">Tổng giá trị</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">
                        {formatVND(orders.reduce((sum, o) => sum + o.amount, 0))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-sm text-purple-200">Hoa hồng sẽ chi</div>
                    <div className="text-2xl font-bold text-purple-400 mt-1">
                        {formatVND(orders.reduce((sum, o) => sum + o.amount * 0.25, 0))}
                    </div>
                    <div className="text-xs text-purple-300 mt-1">(Ước tính 25%)</div>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-[#FFBF00]" size={48} />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-slate-800 rounded-xl p-12 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                    <h3 className="text-2xl font-bold text-white mb-2">Không có đơn chờ duyệt!</h3>
                    <p className="text-slate-400">Tất cả đơn hàng đã được xử lý.</p>
                </div>
            ) : (
                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                    <table className="w-full">
                        <thead className="bg-slate-900">
                            <tr>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    <Calendar size={16} className="inline mr-2" />
                                    Ngày tạo
                                </th>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    <User size={16} className="inline mr-2" />
                                    Khách hàng
                                </th>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    <DollarSign size={16} className="inline mr-2" />
                                    Số tiền
                                </th>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    <ImageIcon size={16} className="inline mr-2" />
                                    Bill
                                </th>
                                <th className="text-center p-4 text-slate-400 font-medium">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors"
                                >
                                    <td className="p-4 text-slate-300 text-sm">{formatDate(order.created_at)}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-white">{order.user?.name || 'N/A'}</div>
                                        <div className="text-xs text-slate-400">{order.user?.email || ''}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#FFBF00] text-lg">
                                            {formatVND(order.amount)}
                                        </div>
                                        <div className="text-xs text-slate-500">{order.currency}</div>
                                    </td>
                                    <td className="p-4">
                                        {order.payment_proof_url ? (
                                            <button
                                                onClick={() => setSelectedImage(order.payment_proof_url!)}
                                                className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-500/30 transition-colors"
                                            >
                                                <Eye size={14} />
                                                Xem Bill
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <AlertTriangle size={14} />
                                                Chưa có ảnh
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleApprove(order.id)}
                                                disabled={processingId === order.id}
                                                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === order.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={16} />
                                                )}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(order.id)}
                                                disabled={processingId === order.id}
                                                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 bg-slate-800 flex justify-between items-center">
                                <h3 className="text-white font-bold">Payment Proof</h3>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <img
                                src={selectedImage}
                                alt="Payment proof"
                                className="w-full h-auto max-h-[calc(90vh-80px)] object-contain"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warning Banner */}
            <div className="mt-6 bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-400 mt-1" size={20} />
                    <div className="text-sm text-amber-200">
                        <strong className="text-amber-400">⚠️ Lưu ý chống gian lận:</strong>
                        <br />
                        Luôn kiểm tra số dư trong tài khoản ngân hàng TRƯỚC khi approve. Tiền trong bank mới là thật, ảnh Bill chỉ là tham khảo!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
