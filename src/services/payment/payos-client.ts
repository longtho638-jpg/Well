/**
 * PayOS Payment Gateway Client
 * Thin wrapper over vibe-payment SDK with circuit breaker resilience.
 *
 * Backward-compatible: all existing imports continue to work.
 * Internally delegates to vibe-payment PayOSAdapter.
 */

import { supabase } from '@/lib/supabase';
import { createPaymentProvider } from '@/lib/vibe-payment';
import type { VibePaymentResponse, VibePaymentStatus } from '@/lib/vibe-payment';
import { PaymentError } from '@/utils/errors';
import { paymentBreaker } from '@/utils/circuit-breaker';

// SDK provider instance (singleton)
const provider = createPaymentProvider('payos', supabase);

// ─── Backward-compatible type re-exports ────────────────────────

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

// ─── API (circuit-breaker wrapped) ──────────────────────────────

export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    return paymentBreaker.execute(async () => {
        try {
            const result: VibePaymentResponse = await provider.createPayment(request);
            return { checkoutUrl: result.checkoutUrl, orderCode: result.orderCode } as PaymentResponse;
        } catch (err) {
            throw new PaymentError(
                `Payment creation failed: ${err instanceof Error ? err.message : 'Unknown'}`,
                { orderCode: request.orderCode },
            );
        }
    });
}

export async function getPaymentStatus(orderCode: number): Promise<PaymentStatus> {
    return paymentBreaker.execute(async () => {
        try {
            const result: VibePaymentStatus = await provider.getPaymentStatus(orderCode);
            return result as unknown as PaymentStatus;
        } catch (err) {
            throw new PaymentError(
                `Payment status check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
                { orderCode },
            );
        }
    });
}

export async function cancelPayment(
    orderCode: number,
    cancellationReason: string = 'User cancelled',
): Promise<PaymentStatus> {
    return paymentBreaker.execute(async () => {
        try {
            const result: VibePaymentStatus = await provider.cancelPayment(orderCode, cancellationReason);
            return result as unknown as PaymentStatus;
        } catch (err) {
            throw new PaymentError(
                `Payment cancellation failed: ${err instanceof Error ? err.message : 'Unknown'}`,
                { orderCode },
            );
        }
    });
}

export function isPayOSConfigured(): boolean {
    return provider.isConfigured();
}

/** @deprecated Webhook verification handled server-side */
export async function verifyWebhook(
    webhookBody: { data?: Record<string, unknown>; signature?: string },
): Promise<Record<string, unknown>> {
    return webhookBody.data || {};
}

export default {
    createPayment,
    getPaymentStatus,
    cancelPayment,
    verifyWebhook,
    isPayOSConfigured,
};
