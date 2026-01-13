import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, User, DollarSign, Image as ImageIcon,
    CheckCircle, XCircle, Eye, AlertTriangle, Loader2,
    Shield
} from 'lucide-react';
import { PendingOrder } from '@/services/orderService';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface OrderTableProps {
    orders: PendingOrder[];
    processingId: string | null;
    onViewBill: (url: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
    orders,
    processingId,
    onViewBill,
    onApprove,
    onReject
}) => {
    const { t } = useTranslation();
    return (
        <div className="bg-zinc-950/80 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {[
                                { icon: Calendar, label: 'Timeline' },
                                { icon: User, label: 'Partner Identity' },
                                { icon: DollarSign, label: 'Value (VND)' },
                                { icon: ImageIcon, label: 'Evidence' },
                                { icon: Shield, label: 'Governance', center: true }
                            ].map((head, idx) => (
                                <th key={idx} className={`p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic ${head.center ? 'text-center' : ''}`}>
                                    <div className={`flex items-center gap-3 ${head.center ? 'justify-center' : ''}`}>
                                        <head.icon size={14} className="text-zinc-600" />
                                        {head.label}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {orders.map((order, index) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    index={index}
                                    isProcessing={processingId === order.id}
                                    onViewBill={onViewBill}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                />
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface OrderRowProps {
    order: PendingOrder;
    index: number;
    isProcessing: boolean;
    onViewBill: (url: string) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({
    order,
    index,
    isProcessing,
    onViewBill,
    onApprove,
    onReject
}) => {
    const { t } = useTranslation();
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-white/[0.02] transition-all duration-500 group"
        >
            <td className="p-8">
                <div className="text-[11px] font-black text-zinc-400 font-mono tracking-widest uppercase mb-1">
                    {formatDate(order.created_at)}
                </div>
                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">{t('ordertable.transaction_logged')}</div>
            </td>

            <td className="p-8">
                <div className="font-black text-white text-lg tracking-tight group-hover:text-amber-500 transition-colors italic">
                    {order.user?.name || 'Anonymous Partner'}
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {order.user?.email || 'unverified@network.node'}
                </div>
            </td>

            <td className="p-8">
                <div className="font-black text-emerald-500 text-2xl tracking-tighter italic">
                    {formatVND(order.amount)}
                </div>
                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mt-1">{order.currency} {t('ordertable.asset')}</div>
            </td>

            <td className="p-8">
                {order.payment_proof_url ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onViewBill(order.payment_proof_url!)}
                        className="flex items-center gap-3 bg-zinc-900 text-teal-500 px-5 py-3 rounded-2xl border border-teal-500/20 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all font-black text-[10px] uppercase tracking-widest group/btn shadow-xl"
                    >
                        <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                        {t('ordertable.inspect_bill')}</motion.button>
                ) : (
                    <div className="flex items-center gap-3 text-rose-500/60 text-[10px] font-black uppercase tracking-widest italic p-3 border border-dashed border-zinc-800 rounded-2xl bg-rose-500/5">
                        <AlertTriangle size={14} />
                        {t('ordertable.no_evidence')}</div>
                )}
            </td>

            <td className="p-8">
                <div className="flex items-center justify-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -12px rgba(16,185,129,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onApprove(order.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-3 bg-[#00575A] text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#004447] transition-all disabled:opacity-50 shadow-xl border border-white/5 italic"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {t('ordertable.approve')}</motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onReject(order.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-500 border border-white/5 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all disabled:opacity-50"
                        title="Reject Transaction"
                    >
                        <XCircle size={20} />
                    </motion.button>
                </div>
            </td>
        </motion.tr>
    );
};
