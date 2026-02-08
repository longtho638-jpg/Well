/**
 * PayOS Payment Gateway Client
 * Vietnamese QR payment integration service
 *
 * SECURE IMPLEMENTATION: All payment operations are proxied through
 * Supabase Edge Functions to keep credentials server-side only.
 */

import { supabase } from '@/lib/supabase';
import { PaymentError } from '@/utils/errors';
import { paymentBreaker } from '@/utils/circuit-breaker';

export interface PaymentItem {
    name: string;
    quantity: number;
    price: number;
}

export interface PaymentResponse {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
}

export interface PaymentStatus {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    createdAt: string;
    transactions: Record<string, unknown>[];
    cancellationReason?: string;
    canceledAt?: string;
}

export interface CreatePaymentRequest {
    orderCode: number;
    amount: number;
    description: string;
    items: PaymentItem[];
    returnUrl: string;
    cancelUrl: string;
}

/**
 * Create a new payment request via secure Edge Function
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    return paymentBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('payos-create-payment', {
            body: {
                orderCode: request.orderCode,
                amount: request.amount,
                description: request.description,
                items: request.items,
                returnUrl: request.returnUrl,
                cancelUrl: request.cancelUrl,
            },
        });

        if (error) {
            throw new PaymentError(`Payment creation failed: ${error.message}`, { orderCode: request.orderCode });
        }

        return {
            checkoutUrl: data.checkoutUrl,
            orderCode: data.orderCode,
        } as PaymentResponse;
    });
}

/**
 * Check payment status via secure Edge Function proxy
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatus> {
    return paymentBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('payos-get-payment', {
            body: { orderCode },
        });

        if (error) {
            throw new PaymentError(`Payment status check failed: ${error.message}`, { orderCode });
        }

        return data as PaymentStatus;
    });
}

/**
 * Cancel a payment via secure Edge Function proxy
 */
export async function cancelPayment(
    orderCode: number,
    cancellationReason: string = 'User cancelled'
): Promise<PaymentStatus> {
    return paymentBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('payos-cancel-payment', {
            body: { orderCode, cancellationReason },
        });

        if (error) {
            throw new PaymentError(`Payment cancellation failed: ${error.message}`, { orderCode });
        }

        return data as PaymentStatus;
    });
}

/**
 * Check if PayOS is configured (always true with Edge Functions)
 */
export function isPayOSConfigured(): boolean {
    // Always return true since configuration is server-side
    return true;
}

/**
 * Webhook verification is now handled server-side in Edge Function
 * This function is deprecated and kept for backward compatibility
 */
export async function verifyWebhook(webhookBody: { data?: Record<string, unknown>; signature?: string }): Promise<Record<string, unknown>> {
    return webhookBody.data || {};
}

export default {
    createPayment,
    getPaymentStatus,
    cancelPayment,
    verifyWebhook,
    isPayOSConfigured,
};
