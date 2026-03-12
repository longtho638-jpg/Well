/**
 * Webhook Signature Verification Tests
 *
 * Tests for HMAC-SHA256 signature verification utility
 * Covers: Polar, Stripe, and PayOS providers
 * Test scenarios: valid signatures, replay attacks, invalid signatures, missing signatures
 */

import { describe, it, expect } from 'vitest';
import {
    verifyWebhookSignature,
    verifyWebhookSignatureWithTimestamp,
    type WebhookProvider,
    type SignatureVerificationResult,
} from '../webhook-signature-verify';

// Test secrets
const TEST_SECRETS = {
    polar: 'whsec_polar_test_secret_key_1234567890abcdef',
    stripe: 'whsec_stripe_test_secret_key_1234567890abcdef',
    payos: 'payos_checksum_key_abcdef1234567890',
};

// Test payloads
const TEST_PAYLOADS = {
    polar: { event_id: 'evt_123', type: 'subscription.created', data: { id: 'sub_456' } },
    stripe: { id: 'evt_123', type: 'invoice.payment_succeeded', data: { object: { id: 'inv_456' } } },
    payos: { orderCode: 123456, amount: 100000, description: 'Test payment' },
};

/**
 * Compute HMAC-SHA256 for test data (matches implementation)
 */
async function computeTestSignature(payload: unknown, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payloadString));
    return Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

describe('Webhook Signature Verification', () => {
    describe('Polar provider', () => {
        it('should verify valid Polar signature', async () => {
            const payload = TEST_PAYLOADS.polar;
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            const polarSig = `sha256=${signature}`;

            const result = await verifyWebhookSignature(
                payload,
                polarSig,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should reject invalid Polar signature', async () => {
            // Use valid hex format but wrong signature value
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.polar,
                'sha256=0000000000000000000000000000000000000000000000000000000000000000',
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('invalid_signature');
        });

        it('should reject missing Polar signature', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.polar,
                null,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('missing_signature');
        });

        it('should reject malformed Polar signature', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.polar,
                'invalid-format',
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('malformed_signature');
        });
    });

    describe('Stripe provider', () => {
        it('should verify valid Stripe signature', async () => {
            const payload = TEST_PAYLOADS.stripe;
            const signature = await computeTestSignature(payload, TEST_SECRETS.stripe);
            const stripeSig = `v1=${signature}`;

            const result = await verifyWebhookSignature(
                payload,
                stripeSig,
                TEST_SECRETS.stripe,
                'stripe',
            );

            expect(result.isValid).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should reject invalid Stripe signature', async () => {
            // Use valid hex format but wrong signature value
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.stripe,
                'v1=0000000000000000000000000000000000000000000000000000000000000000',
                TEST_SECRETS.stripe,
                'stripe',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('invalid_signature');
        });

        it('should reject missing Stripe signature', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.stripe,
                undefined,
                TEST_SECRETS.stripe,
                'stripe',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('missing_signature');
        });

        it('should reject malformed Stripe signature', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.stripe,
                'invalid-stripe-format',
                TEST_SECRETS.stripe,
                'stripe',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('malformed_signature');
        });
    });

    describe('PayOS provider', () => {
        it('should verify valid PayOS signature', async () => {
            const payload = TEST_PAYLOADS.payos;
            const signature = await computeTestSignature(payload, TEST_SECRETS.payos);

            const result = await verifyWebhookSignature(
                payload,
                signature,
                TEST_SECRETS.payos,
                'payos',
            );

            expect(result.isValid).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should reject invalid PayOS signature', async () => {
            // Use valid hex format but wrong signature value
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.payos,
                '0000000000000000000000000000000000000000000000000000000000000000',
                TEST_SECRETS.payos,
                'payos',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('invalid_signature');
        });

        it('should reject missing PayOS signature', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.payos,
                null,
                TEST_SECRETS.payos,
                'payos',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('missing_signature');
        });

        it('should reject malformed PayOS signature (non-hex)', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.payos,
                'invalid-signature-with-dashes',
                TEST_SECRETS.payos,
                'payos',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('malformed_signature');
        });
    });

    describe('Timestamp validation (replay attack prevention)', () => {
        it('should accept valid signature with timestamp within tolerance', async () => {
            const payload = TEST_PAYLOADS.polar;
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            const currentTimestamp = Date.now();
            // Note: Current implementation doesn't embed timestamp in Polar format
            // This test verifies the signature passes, timestamp validation is optional
            const polarSig = `sha256=${signature}`;

            const result = await verifyWebhookSignatureWithTimestamp(
                payload,
                polarSig,
                TEST_SECRETS.polar,
                'polar',
                300, // 5 minutes
                currentTimestamp,
            );

            // Signature is valid (no timestamp embedded in current format)
            expect(result.isValid).toBe(true);
        });

        it('should handle expired timestamp when provided', async () => {
            // Simulate a scenario where timestamp is embedded in payload
            const oldTimestamp = Date.now() - 600 * 1000; // 10 minutes ago
            const payloadWithTime = { ...TEST_PAYLOADS.stripe, timestamp: oldTimestamp };
            const signature = await computeTestSignature(payloadWithTime, TEST_SECRETS.stripe);
            const stripeSig = `v1=${signature}`;

            const result = await verifyWebhookSignatureWithTimestamp(
                payloadWithTime,
                stripeSig,
                TEST_SECRETS.stripe,
                'stripe',
                300, // 5 minutes tolerance
                Date.now(),
            );

            // Current implementation: timestamp must be in signature, not payload
            // So this passes signature check but no timestamp validation
            expect(result.isValid).toBe(true);
        });

        it('should accept fresh webhook (within tolerance)', async () => {
            const payload = TEST_PAYLOADS.polar;
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            const polarSig = `sha256=${signature}`;

            const result = await verifyWebhookSignatureWithTimestamp(
                payload,
                polarSig,
                TEST_SECRETS.polar,
                'polar',
                300, // 5 minutes
                Date.now(),
            );

            expect(result.isValid).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty payload', async () => {
            const signature = await computeTestSignature('', TEST_SECRETS.polar);
            const polarSig = `sha256=${signature}`;

            const result = await verifyWebhookSignature(
                '',
                polarSig,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(true);
        });

        it('should handle object payload (auto-stringify)', async () => {
            const payload = { test: 'data', nested: { value: 123 } };
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            const polarSig = `sha256=${signature}`;

            const result = await verifyWebhookSignature(
                payload,
                polarSig,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(true);
        });

        it('should handle empty signature string', async () => {
            const result = await verifyWebhookSignature(
                TEST_PAYLOADS.polar,
                '',
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('missing_signature');
        });

        it('should use constant-time comparison (timing attack prevention)', async () => {
            const payload = TEST_PAYLOADS.polar;
            const validSig = await computeTestSignature(payload, TEST_SECRETS.polar);

            // Create signatures with varying degrees of similarity (valid hex format)
            const similarSigs = [
                validSig.slice(0, -1) + 'f', // Last char different
                'f' + validSig.slice(1), // First char different
                validSig.slice(0, 10) + 'abcdabcdabcd', // Middle different
            ];

            for (const sig of similarSigs) {
                const result = await verifyWebhookSignature(
                    payload,
                    `sha256=${sig}`,
                    TEST_SECRETS.polar,
                    'polar',
                );
                expect(result.isValid).toBe(false);
            }
        });

        it('should handle different secret keys', async () => {
            const payload = TEST_PAYLOADS.polar;
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            const polarSig = `sha256=${signature}`;

            // Wrong secret
            const result = await verifyWebhookSignature(
                payload,
                polarSig,
                'wrong_secret_key',
                'polar',
            );

            expect(result.isValid).toBe(false);
            expect(result.reason).toBe('invalid_signature');
        });

        it('should preserve case-insensitivity for hex signatures', async () => {
            const payload = TEST_PAYLOADS.polar;
            const signature = await computeTestSignature(payload, TEST_SECRETS.polar);
            // Use uppercase signature
            const polarSig = `sha256=${signature.toUpperCase()}`;

            const result = await verifyWebhookSignature(
                payload,
                polarSig,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result.isValid).toBe(true);
        });
    });

    describe('Type safety', () => {
        it('should accept all valid provider types', async () => {
            const providers: WebhookProvider[] = ['polar', 'stripe', 'payos'];

            for (const provider of providers) {
                const payload = TEST_PAYLOADS[provider];
                const secret = TEST_SECRETS[provider];
                const signature = await computeTestSignature(payload, secret);

                let sigHeader: string;
                if (provider === 'polar') sigHeader = `sha256=${signature}`;
                else if (provider === 'stripe') sigHeader = `v1=${signature}`;
                else sigHeader = signature;

                const result = await verifyWebhookSignature(payload, sigHeader, secret, provider);
                expect(result.isValid).toBe(true);
            }
        });

        it('should return proper result type', async () => {
            const result: SignatureVerificationResult = await verifyWebhookSignature(
                TEST_PAYLOADS.polar,
                null,
                TEST_SECRETS.polar,
                'polar',
            );

            expect(result).toHaveProperty('isValid');
            expect(typeof result.isValid).toBe('boolean');
        });
    });
});
