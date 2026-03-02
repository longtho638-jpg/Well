/**
 * useQRPaymentStatusPoller hook
 * Polls PayOS payment status every 3s, manages countdown timer,
 * and triggers success/failure callbacks for the QRPaymentModal component
 */

import { useState, useEffect } from 'react';
import { getPaymentStatus, type PaymentResponse } from '@/services/payment/payos-client';
import { useTranslation } from '@/hooks';

type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

interface UseQRPaymentStatusPollerProps {
    isOpen: boolean;
    paymentData: PaymentResponse | null;
    onSuccess: (orderCode: number) => void;
    onFailure: (error: string) => void;
}

export function useQRPaymentStatusPoller({
    isOpen,
    paymentData,
    onSuccess,
    onFailure,
}: UseQRPaymentStatusPollerProps) {
    const { t } = useTranslation();
    const [status, setStatus] = useState<PaymentStatus>('pending');
    const [timeLeft, setTimeLeft] = useState(600);
    const [isChecking, setIsChecking] = useState(false);

    // Auto-poll payment status every 3 seconds
    useEffect(() => {
        if (!isOpen || !paymentData || status !== 'pending') return;

        const interval = setInterval(async () => {
            try {
                setIsChecking(true);
                const statusResponse = await getPaymentStatus(paymentData.orderCode);
                if (statusResponse.status === 'PAID') {
                    setStatus('success');
                    clearInterval(interval);
                    onSuccess(paymentData.orderCode);
                } else if (statusResponse.status === 'CANCELLED') {
                    setStatus('failed');
                    onFailure('Payment was cancelled');
                    clearInterval(interval);
                }
            } catch {
                // retry on next tick
            } finally {
                setIsChecking(false);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isOpen, paymentData, status, onSuccess, onFailure]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || status !== 'pending') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setStatus('failed');
                    onFailure('Payment expired');
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, status, onFailure]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClose = (onClose: () => void) => {
        if (status === 'pending') {
            if (window.confirm(t('checkout.payment.confirm_close'))) onClose();
        } else {
            onClose();
        }
    };

    return { status, timeLeft, isChecking, formatTime, handleClose };
}
