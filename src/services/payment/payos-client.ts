/**
 * PayOS Payment Gateway Client
 * Vietnamese QR payment integration service
 *
 * NOTE: In a production environment, payment creation and signature generation
 * should be done on the backend to keep the Client ID, API Key, and Checksum Key secure.
 * This client-side implementation is for demonstration/MVP purposes only.
 */

// PayOS configuration from environment variables
const PAYOS_CLIENT_ID = import.meta.env.VITE_PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = import.meta.env.VITE_PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = import.meta.env.VITE_PAYOS_CHECKSUM_KEY || '';

const PAYOS_BASE_URL = 'https://api-merchant.payos.vn/v2';

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
    transactions: any[];
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
 * Helper to generate HMAC-SHA256 signature using Web Crypto API
 */
async function generateSignature(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(data);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        msgData
    );

    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Helper to sort object keys and create query string for signature
 */
function createSignatureData(obj: Record<string, any>): string {
    const sortedKeys = Object.keys(obj).sort();
    return sortedKeys.map(key => `${key}=${obj[key]}`).join('&');
}

/**
 * Create a new payment request
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    if (!isPayOSConfigured()) {
        throw new Error('PayOS is not configured');
    }

    try {
        const body: any = {
            orderCode: request.orderCode,
            amount: request.amount,
            description: request.description,
            items: request.items,
            returnUrl: request.returnUrl,
            cancelUrl: request.cancelUrl,
        };

        // Create signature data string (amount, cancelUrl, description, orderCode, returnUrl)
        const signatureData = `amount=${body.amount}&cancelUrl=${body.cancelUrl}&description=${body.description}&orderCode=${body.orderCode}&returnUrl=${body.returnUrl}`;

        const signature = await generateSignature(signatureData, PAYOS_CHECKSUM_KEY);
        body.signature = signature;

        const response = await fetch(`${PAYOS_BASE_URL}/payment-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok || data.code !== '00') {
            throw new Error(data.desc || 'Failed to create payment request');
        }

        return data.data;
    } catch (error) {
        console.error('PayOS create payment error:', error);
        throw error;
    }
}

/**
 * Check payment status
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatus> {
    if (!isPayOSConfigured()) {
        throw new Error('PayOS is not configured');
    }

    try {
        const response = await fetch(`${PAYOS_BASE_URL}/payment-requests/${orderCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
            },
        });

        const data = await response.json();

        if (!response.ok || data.code !== '00') {
            throw new Error(data.desc || 'Failed to get payment status');
        }

        return data.data;
    } catch (error) {
        console.error('PayOS get payment status error:', error);
        throw error;
    }
}

/**
 * Cancel a payment
 */
export async function cancelPayment(
    orderCode: number,
    cancellationReason: string = 'User cancelled'
): Promise<PaymentStatus> {
    if (!isPayOSConfigured()) {
        throw new Error('PayOS is not configured');
    }

    try {
        const response = await fetch(`${PAYOS_BASE_URL}/payment-requests/${orderCode}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
            },
            body: JSON.stringify({ cancellationReason }),
        });

        const data = await response.json();

        if (!response.ok || data.code !== '00') {
            throw new Error(data.desc || 'Failed to cancel payment');
        }

        return data.data;
    } catch (error) {
        console.error('PayOS cancel payment error:', error);
        throw error;
    }
}

/**
 * Check if PayOS is configured
 */
export function isPayOSConfigured(): boolean {
    return !!(PAYOS_CLIENT_ID && PAYOS_API_KEY && PAYOS_CHECKSUM_KEY);
}

export default {
    createPayment,
    getPaymentStatus,
    cancelPayment,
    isPayOSConfigured,
};
