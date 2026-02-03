/**
 * PayOS Payment Gateway Client
 * Vietnamese QR payment integration service
 */

import { PayOS } from '@payos/node';
import type {
	CreatePaymentLinkRequest,
	CreatePaymentLinkResponse,
	PaymentLink,
	PaymentLinkItem,
	Webhook,
	WebhookData as PayOSWebhookData,
} from '@payos/node';

// PayOS configuration from environment variables
const PAYOS_CLIENT_ID = import.meta.env.VITE_PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = import.meta.env.VITE_PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = import.meta.env.VITE_PAYOS_CHECKSUM_KEY || '';

// Initialize PayOS client
const payOS = new PayOS({
	clientId: PAYOS_CLIENT_ID,
	apiKey: PAYOS_API_KEY,
	checksumKey: PAYOS_CHECKSUM_KEY,
});

// Re-export types for convenience
export type PaymentItem = PaymentLinkItem;
export type PaymentResponse = CreatePaymentLinkResponse;
export type PaymentStatus = PaymentLink;
export type WebhookData = PayOSWebhookData;

export interface CreatePaymentRequest {
	orderCode: number;
	amount: number;
	description: string;
	items: PaymentItem[];
	returnUrl: string;
	cancelUrl: string;
}

/**
 * Create a new payment request
 * @param request Payment request data
 * @returns Payment response with QR code and checkout URL
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
	try {
		const paymentData: CreatePaymentLinkRequest = {
			orderCode: request.orderCode,
			amount: request.amount,
			description: request.description,
			items: request.items,
			returnUrl: request.returnUrl,
			cancelUrl: request.cancelUrl,
		};

		const response = await payOS.paymentRequests.create(paymentData);
		return response;
	} catch (error) {
		console.error('PayOS create payment error:', error);
		throw new Error('Failed to create payment request');
	}
}

/**
 * Check payment status
 * @param orderCode Order code to check
 * @returns Payment status information
 */
export async function getPaymentStatus(orderCode: number): Promise<PaymentStatus> {
	try {
		const response = await payOS.paymentRequests.get(orderCode);
		return response;
	} catch (error) {
		console.error('PayOS get payment status error:', error);
		throw new Error('Failed to get payment status');
	}
}

/**
 * Cancel a payment
 * @param orderCode Order code to cancel
 * @param cancellationReason Reason for cancellation
 * @returns Cancellation result
 */
export async function cancelPayment(
	orderCode: number,
	cancellationReason?: string
): Promise<PaymentStatus> {
	try {
		const response = await payOS.paymentRequests.cancel(orderCode, cancellationReason);
		return response;
	} catch (error) {
		console.error('PayOS cancel payment error:', error);
		throw new Error('Failed to cancel payment');
	}
}

/**
 * Verify webhook data from PayOS
 * @param webhook Webhook object received from PayOS
 * @returns Verified webhook data
 */
export async function verifyWebhook(webhook: Webhook): Promise<WebhookData> {
	try {
		const verifiedData = await payOS.webhooks.verify(webhook);
		return verifiedData;
	} catch (error) {
		console.error('PayOS verify webhook error:', error);
		throw new Error('Failed to verify webhook data');
	}
}

/**
 * Check if PayOS is configured
 * @returns True if all required environment variables are set
 */
export function isPayOSConfigured(): boolean {
	return !!(PAYOS_CLIENT_ID && PAYOS_API_KEY && PAYOS_CHECKSUM_KEY);
}

export default {
	createPayment,
	getPaymentStatus,
	cancelPayment,
	verifyWebhook,
	isPayOSConfigured,
};
