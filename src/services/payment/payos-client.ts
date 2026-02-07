/**
 * PayOS Payment Gateway Client
 * Vietnamese QR payment integration service
 *
 * SECURE IMPLEMENTATION: All payment operations are proxied through
 * Supabase Edge Functions to keep credentials server-side only.
 */

import { supabase } from '@/lib/supabase';

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
    try {
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
            throw new Error(`Payment creation failed: ${error.message}`);
        }

        // Return payment response matching expected interface
        return {
            checkoutUrl: data.checkoutUrl,
            orderCode: data.orderCode,
            // Other fields will be populated by PayOS webhook/status check
        } as PaymentResponse;
    } catch (error) {
        console.error('PayOS create payment error:', error);
        throw error;
    }
}

/**
 * Check payment status via secure Edge Function proxy
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatus> {
    try {
        const { data, error } = await supabase.functions.invoke('payos-get-payment', {
            body: { orderCode },
        });

        if (error) {
            throw new Error(`Payment status check failed: ${error.message}`);
        }

        return data as PaymentStatus;
    } catch (error) {
        console.error('PayOS get payment status error:', error);
        throw error;
    }
}

/**
 * Cancel a payment via secure Edge Function proxy
 */
export async function cancelPayment(
    orderCode: number,
    cancellationReason: string = 'User cancelled'
): Promise<PaymentStatus> {
    try {
        const { data, error } = await supabase.functions.invoke('payos-cancel-payment', {
            body: { orderCode, cancellationReason },
        });

        if (error) {
            throw new Error(`Payment cancellation failed: ${error.message}`);
        }

        return data as PaymentStatus;
    } catch (error) {
        console.error('PayOS cancel payment error:', error);
        throw error;
    }
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
    console.warn('verifyWebhook is deprecated - webhook verification now handled server-side');
    return webhookBody.data || {};
}

export default {
    createPayment,
    getPaymentStatus,
    cancelPayment,
    verifyWebhook,
    isPayOSConfigured,
};
