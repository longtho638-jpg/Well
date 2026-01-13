/**
 * WellNexus Order Management (Max Level)
 * 
 * Production-ready interface for administrative order approval and commission triggering.
 * Applied premium "Aura Elite" design system with high-fidelity telemetry and strategic safety protocols.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, RefreshCw, Loader2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

// Modular Components
import { OrderStats } from '@/components/admin/orders/OrderStats';
import { OrderTable } from '@/components/admin/orders/OrderTable';
import { OrderImageModal } from '@/components/admin/orders/OrderImageModal';
import { useTranslation } from '@/hooks';

const OrderManagement: React.FC = () => {
    const { t } = useTranslation();
    const {
        orders,
        loading,
        processingId,
        stats,
        refresh,
        approveOrder,
        rejectOrder
    } = useOrders();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <DollarSign className="text-zinc-950" size={28} />
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{t('ordermanagement.cashflow_hub')}</h2>
                    </div>
                    <p className="text-zinc-500 font-medium text-lg">{t('ordermanagement.verify_transactions_and')}<span className="text-emerald-400 font-bold uppercase italic">{t('ordermanagement.activate_commissions')}</span></p>
                </div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={refresh}
                        disabled={loading}
                        className="p-4 bg-zinc-900 border border-white/5 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all text-zinc-400 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </motion.button>
                </div>
            </motion.div>

            {/* Statistics Section */}
            <OrderStats
                count={stats.count}
                totalValue={stats.totalValue}
                estimatedCommission={stats.estimatedCommission}
            />

            {/* Main Content Area */}
            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center bg-zinc-900/30 rounded-[3rem] border border-white/5">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-6" />
                    <p className="text-zinc-500 font-black uppercase tracking-[0.3em] animate-pulse text-[10px]">{t('ordermanagement.syncing_global_ledgers')}</p>
                </div>
            ) : orders.length === 0 ? (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-32 text-center bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800/50 backdrop-blur-sm"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                        <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t('ordermanagement.queue_synchronized')}</h3>
                    <p className="text-zinc-500 font-medium mt-2">{t('ordermanagement.all_pending_orders_have_been_p')}</p>
                </motion.div>
            ) : (
                <OrderTable
                    orders={orders}
                    processingId={processingId}
                    onViewBill={setSelectedImage}
                    onApprove={approveOrder}
                    onReject={rejectOrder}
                />
            )}

            {/* Strategic Safety Protocol Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck size={120} />
                </div>

                <div className="flex items-start gap-8 relative z-10">
                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shadow-xl border border-amber-500/20">
                        <AlertTriangle className="text-amber-500" size={28} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white mb-3 uppercase tracking-tighter italic">{t('ordermanagement.operational_risk_protocol')}</h4>
                        <div className="text-zinc-500 leading-relaxed font-medium max-w-2xl">
                            {t('ordermanagement.strict_compliance_rule')}<strong className="text-amber-500 uppercase italic">{t('ordermanagement.never_approve')}</strong> {t('ordermanagement.without_verified_bank_clearanc')}</div>
                    </div>
                </div>
            </motion.div>

            {/* Modals */}
            <OrderImageModal
                imageUrl={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
};

export default OrderManagement;
