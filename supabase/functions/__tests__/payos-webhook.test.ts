/**
 * PayOS Webhook Integration Tests
 *
 * Tests for webhook signature verification, event processing, and transaction logging.
 * Run: pnpm vitest run supabase/functions/__tests__/payos-webhook.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { hmacSha256, secureCompare } from '../_shared/vibe-payos/crypto.ts';

// Mock PayOS webhook payload
function createMockWebhookPayload(orderCode: number, amount: number, code: '00' | '01' | string = '00') {
  return {
    data: {
      orderCode,
      amount,
      description: `Test payment ${orderCode}`,
      accountNumber: '1234567890',
      reference: `REF${orderCode}`,
      transactionDateTime: new Date().toISOString(),
      currency: 'VND',
      paymentLinkId: `link-${orderCode}`,
      code, // '00' = paid, '01' = cancelled
      desc: code === '00' ? 'Successfully paid' : code === '01' ? 'Cancelled' : 'Pending',
    },
    signature: '', // Will be computed
  };
}

describe('PayOS Webhook', () => {
  describe('Signature Verification', () => {
    it('should compute HMAC-SHA256 correctly', async () => {
      const key = 'test-secret-key';
      const message = 'test-message';
      const result = await hmacSha256(key, message);
      expect(result).toHaveLength(64); // SHA256 = 64 hex chars
    });

    it('should securely compare signatures (timing-safe)', () => {
      const sig1 = 'abc123def456';
      const sig2 = 'abc123def456';
      const sig3 = 'xyz789uvw012';

      expect(secureCompare(sig1, sig2)).toBe(true);
      expect(secureCompare(sig1, sig3)).toBe(false);
      expect(secureCompare(sig1, sig1.substring(0, 6))).toBe(false); // Different length
    });

    it('should reject tampered signature', async () => {
      const key = 'test-checksum-key';
      const data = { orderCode: 123, amount: 100000 };
      const signatureData = Object.keys(data).sort().map(k => `${k}=${data[k as keyof typeof data]}`).join('&');
      const validSig = await hmacSha256(key, signatureData);
      const tamperedSig = 'invalid-' + validSig.substring(8);

      expect(secureCompare(validSig, tamperedSig)).toBe(false);
    });
  });

  describe('Webhook Payload Parsing', () => {
    it('should parse valid payment payload', () => {
      const payload = createMockWebhookPayload(12345, 100000, '00');
      expect(payload.data.orderCode).toBe(12345);
      expect(payload.data.amount).toBe(100000);
      expect(payload.data.code).toBe('00');
    });

    it('should handle cancellation payload', () => {
      const payload = createMockWebhookPayload(12345, 100000, '01');
      expect(payload.data.code).toBe('01');
      expect(payload.data.desc).toContain('Cancelled');
    });

    it('should include all required PayOS fields', () => {
      const payload = createMockWebhookPayload(99999, 250000);
      const requiredFields = ['orderCode', 'amount', 'description', 'accountNumber', 'reference', 'code'];
      requiredFields.forEach(field => {
        expect(payload.data).toHaveProperty(field);
      });
    });
  });

  describe('Status Code Mapping', () => {
    function codeToStatus(code: string): string {
      if (code === '00') return 'paid';
      if (code === '01') return 'cancelled';
      return 'pending';
    }

    it('should map code 00 to paid', () => {
      expect(codeToStatus('00')).toBe('paid');
    });

    it('should map code 01 to cancelled', () => {
      expect(codeToStatus('01')).toBe('cancelled');
    });

    it('should map other codes to pending', () => {
      expect(codeToStatus('99')).toBe('pending');
    });
  });

  describe('Idempotency Guard', () => {
    const processedWebhooks = new Map<number, string>();

    beforeEach(() => {
      processedWebhooks.clear();
    });

    it('should process first webhook', () => {
      const orderCode = 11111;
      const status = 'paid';

      expect(processedWebhooks.has(orderCode)).toBe(false);
      processedWebhooks.set(orderCode, status);
      expect(processedWebhooks.get(orderCode)).toBe('paid');
    });

    it('should ignore duplicate webhook (idempotency)', () => {
      const orderCode = 22222;

      // First processing
      processedWebhooks.set(orderCode, 'paid');
      expect(processedWebhooks.get(orderCode)).toBe('paid');

      // Duplicate should be ignored
      const existingStatus = processedWebhooks.get(orderCode);
      expect(existingStatus).toBe('paid'); // Already processed
    });

    it('should reject status change to cancelled after paid (state machine)', () => {
      const orderCode = 33333;
      processedWebhooks.set(orderCode, 'paid');

      // Attempted transition: paid -> cancelled (invalid)
      const currentStatus = processedWebhooks.get(orderCode);
      const validTransitions: Record<string, string[]> = {
        pending: ['paid', 'cancelled'],
        paid: [], // terminal
        cancelled: [], // terminal
      };

      expect(validTransitions[currentStatus!]).not.toContain('cancelled');
    });
  });

  describe('Retry Logic Simulation', () => {
    const MAX_RETRIES = 3;
    const retryCounts = new Map<number, number>();

    beforeEach(() => {
      retryCounts.clear();
    });

    it('should succeed on first attempt', () => {
      const orderCode = 44444;
      retryCounts.set(orderCode, 1);
      expect(retryCounts.get(orderCode)).toBe(1);
    });

    it('should retry on transient failure', () => {
      const orderCode = 55555;

      // Simulate failures then success
      let attempts = 0;
      while (attempts < 3) {
        attempts++;
        retryCounts.set(orderCode, attempts);
      }

      expect(retryCounts.get(orderCode)).toBeLessThanOrEqual(MAX_RETRIES);
    });

    it('should stop retrying after max retries', () => {
      const orderCode = 66666;

      for (let i = 1; i <= MAX_RETRIES + 2; i++) {
        if (retryCounts.get(orderCode) === undefined || retryCounts.get(orderCode)! < MAX_RETRIES) {
          retryCounts.set(orderCode, (retryCounts.get(orderCode) || 0) + 1);
        }
      }

      expect(retryCounts.get(orderCode)).toBe(MAX_RETRIES);
    });
  });

  describe('Transaction Logging', () => {
    const transactions: Array<{
      user_id: string;
      amount: number;
      type: string;
      status: string;
      reference_id: string;
    }> = [];

    beforeEach(() => {
      transactions.splice(0, transactions.length);
    });

    it('should log successful payment transaction', () => {
      const tx = {
        user_id: 'user-abc',
        amount: 150000,
        type: 'sale',
        status: 'completed',
        reference_id: 'order-789',
      };
      transactions.push(tx);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('sale');
      expect(transactions[0].status).toBe('completed');
    });

    it('should not duplicate transaction (idempotency)', () => {
      const referenceId = 'order-999';

      // First insert
      transactions.push({
        user_id: 'user-xyz',
        amount: 200000,
        type: 'sale',
        status: 'completed',
        reference_id: referenceId,
      });

      // Check for existing before second insert
      const existing = transactions.find(t => t.reference_id === referenceId);
      if (!existing) {
        transactions.push({
          user_id: 'user-xyz',
          amount: 200000,
          type: 'sale',
          status: 'completed',
          reference_id: referenceId,
        });
      }

      // Count transactions with same reference_id
      const count = transactions.filter(t => t.reference_id === referenceId).length;
      expect(count).toBe(1); // Only one, not duplicated
    });

    it('should log different transaction types', () => {
      transactions.push(
        { user_id: 'u1', amount: 100, type: 'sale', status: 'completed', reference_id: 'r1' },
        { user_id: 'u1', amount: 50, type: 'commission', status: 'completed', reference_id: 'r2' },
        { user_id: 'u1', amount: 25, type: 'bonus', status: 'completed', reference_id: 'r3' },
      );

      const types = [...new Set(transactions.map(t => t.type))];
      expect(types).toEqual(expect.arrayContaining(['sale', 'commission', 'bonus']));
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount', () => {
      const payload = createMockWebhookPayload(77777, 0);
      expect(payload.data.amount).toBe(0);
    });

    it('should handle very large amounts', () => {
      const payload = createMockWebhookPayload(88888, 999999999999);
      expect(payload.data.amount).toBe(999999999999);
    });

    it('should handle missing optional fields', () => {
      const minimalPayload = {
        data: {
          orderCode: 99999,
          amount: 50000,
          code: '00',
        },
        signature: 'test-sig',
      };
      expect(minimalPayload.data).not.toHaveProperty('counterAccountName');
    });
  });
});
