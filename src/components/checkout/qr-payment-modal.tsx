/**
 * QR Payment Modal Component
 * Displays PayOS QR code for customer payment with auto-refresh status
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, RefreshCw, Smartphone } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { type PaymentResponse } from '@/services/payment/payos-client';
import { useQRPaymentStatusPoller } from './use-qr-payment-status-poller';

interface QRPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentData: PaymentResponse | null;
    onSuccess: (orderCode: number) => void;
    onFailure: (error: string) => void;
}

export function QRPaymentModal({
    isOpen,
    onClose,
    paymentData,
    onSuccess,
    onFailure,
}: QRPaymentModalProps) {
    const { t } = useTranslation();
    const { status, timeLeft, isChecking, formatTime, handleClose: handleClosePoller } = useQRPaymentStatusPoller({
        isOpen,
        paymentData,
        onSuccess,
        onFailure,
    });

    const handleClose = () => handleClosePoller(onClose);

    if (!paymentData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleClose();
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-6 py-4 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white pr-8">
                                {status === 'success'
                                    ? t('checkout.payment.success')
                                    : status === 'failed'
                                    ? t('checkout.payment.failed')
                                    : t('checkout.payment.qr_scan')}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {status === 'pending' && (
                                <>
                                    {/* QR Code */}
                                    <div className="relative mb-6">
                                        <div className="bg-white rounded-2xl p-4 mx-auto w-fit">
                                            <img
                                                src={paymentData.qrCode}
                                                alt="QR Code"
                                                className="w-64 h-64 object-contain"
                                            />
                                        </div>

                                        {/* Refresh indicator */}
                                        {isChecking && (
                                            <div className="absolute top-2 right-2 bg-slate-800/90 backdrop-blur-sm rounded-full p-2">
                                                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Instructions */}
                                    <div className="flex items-start gap-3 mb-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                                        <Smartphone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-slate-300">
                                            <p className="font-medium text-white mb-1">
                                                {t('checkout.payment.scan_instruction')}
                                            </p>
                                            <p className="text-slate-400">
                                                {t('checkout.payment.scan_detail')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">{t('checkout.payment.amount')}</span>
                                            <span className="text-xl font-bold text-white">
                                                {paymentData.amount.toLocaleString('vi-VN')} {paymentData.currency}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">{t('checkout.payment.order_code')}</span>
                                            <span className="text-white font-mono">{paymentData.orderCode}</span>
                                        </div>
                                    </div>

                                    {/* Timer */}
                                    <div className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                        <Clock className="w-5 h-5 text-amber-400" />
                                        <span className="text-amber-300 font-medium">
                                            {t('checkout.payment.expires_in')}: {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                </>
                            )}

                            {status === 'success' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {t('checkout.payment.success_title')}
                                    </h3>
                                    <p className="text-slate-400">
                                        {t('checkout.payment.success_message')}
                                    </p>
                                </motion.div>
                            )}

                            {status === 'failed' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-12 h-12 text-red-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {t('checkout.payment.failed_title')}
                                    </h3>
                                    <p className="text-slate-400">
                                        {t('checkout.payment.failed_message')}
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {status !== 'pending' && (
                            <div className="px-6 pb-6">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
