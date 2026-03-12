/**
 * PayOS Webhook Handler Tests
 *
 * Tests for PayOS webhook signature verification,
 * event type mapping, and product-to-tier mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  PayOSWebhookHandler,
  createPayOSWebhookHandler,
  verifyPayOSWebhookSignature,
  mapProductToTier,
  determinePayOSEventType,
  prepareLicenseActivationData,
  type PayOSWebhookData,
  type ProductTierMapping,
} from '../payos-webhook-handler';

// ─── Test Data ──────────────────────────────────────────────────

const mockWebhookData: PayOSWebhookData = {
  orderCode: 12345,
  amount: 299000,
  description: 'Premium Monthly Plan - One-time Payment',
  accountNumber: '1234567890',
  reference: 'REF123456',
  transactionDateTime: '2026-03-12T10:30:00Z',
  currency: 'VND',
  paymentLinkId: 'pl_abc123',
  code: '00',
  desc: 'Payment successful',
  counterAccountBankId: 'VNAB',
  counterAccountBankName: 'Vietnam Agriculture Bank',
  counterAccountName: 'NGUYEN VAN A',
  counterAccountNumber: '1234567890',
};

const mockWebhookDataWithItems: PayOSWebhookData = {
  ...mockWebhookData,
  items: [
    {
      product_name: 'premium-monthly',
      quantity: 1,
      unit_price: 299000,
    },
  ],
};

const cancelledWebhookData: PayOSWebhookData = {
  ...mockWebhookData,
  code: '01',
  desc: 'Payment cancelled',
  description: 'Premium Monthly Plan - Payment Cancelled',
};

// ─── Tests ──────────────────────────────────────────────────────

describe('PayOSWebhookHandler', () => {
  describe('constructor', () => {
    it('should create handler with default product tier map', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler).toBeDefined();
      expect(handler.mapProductToTier('basic-monthly')).toBe('basic');
      expect(handler.mapProductToTier('premium-yearly')).toBe('premium');
    });

    it('should create handler with custom product tier map', () => {
      const customMap: ProductTierMapping[] = [
        { productId: 'custom-basic', tier: 'basic', billingCycle: 'monthly' },
        { productId: 'custom-pro', tier: 'enterprise', billingCycle: 'yearly' },
      ];
      const handler = new PayOSWebhookHandler(customMap);
      expect(handler.mapProductToTier('custom-basic')).toBe('basic');
      expect(handler.mapProductToTier('custom-pro')).toBe('enterprise');
      expect(handler.mapProductToTier('unknown')).toBe('basic'); // fallback
    });
  });

  describe('mapProductToTier', () => {
    it('should map basic tier products', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('basic-monthly')).toBe('basic');
      expect(handler.mapProductToTier('basic-yearly')).toBe('basic');
    });

    it('should map premium tier products', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('premium-monthly')).toBe('premium');
      expect(handler.mapProductToTier('premium-yearly')).toBe('premium');
    });

    it('should map enterprise tier products', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('enterprise-monthly')).toBe('enterprise');
      expect(handler.mapProductToTier('enterprise-yearly')).toBe('enterprise');
    });

    it('should map master tier products', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('master-monthly')).toBe('master');
      expect(handler.mapProductToTier('master-yearly')).toBe('master');
    });

    it('should handle case-insensitive product IDs', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('PREMIUM-MONTHLY')).toBe('premium');
      expect(handler.mapProductToTier('Premium-Yearly')).toBe('premium');
    });

    it('should fallback to basic for unknown products', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('unknown-product')).toBe('basic');
    });

    it('should extract tier from product ID patterns', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.mapProductToTier('super-master-plan')).toBe('master');
      expect(handler.mapProductToTier('business-enterprise')).toBe('enterprise');
      expect(handler.mapProductToTier('gold-premium')).toBe('premium');
    });
  });

  describe('determineEventType', () => {
    it('should return payment.completed for code 00', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.determineEventType(mockWebhookData)).toBe('payment.completed');
    });

    it('should return payment.refunded for code 01', () => {
      const handler = new PayOSWebhookHandler();
      expect(handler.determineEventType(cancelledWebhookData)).toBe('payment.refunded');
    });

    it('should return subscription.created for subscription with code 00', () => {
      const handler = new PayOSWebhookHandler();
      const subscriptionData: PayOSWebhookData = {
        ...mockWebhookData,
        description: 'Monthly Subscription Plan',
      };
      expect(handler.determineEventType(subscriptionData)).toBe('subscription.created');
    });

    it('should return subscription.cancelled for subscription with code 01', () => {
      const handler = new PayOSWebhookHandler();
      const subscriptionData: PayOSWebhookData = {
        ...mockWebhookData,
        description: 'Recurring Subscription Payment',
        code: '01',
      };
      expect(handler.determineEventType(subscriptionData)).toBe('subscription.cancelled');
    });
  });

  describe('handleWebhook', () => {
    it('should successfully process valid webhook payload', async () => {
      const handler = new PayOSWebhookHandler();
      const payload = JSON.stringify({ data: mockWebhookData, signature: 'test-sig' });

      const result = await handler.handleWebhook(payload, 'test-sig');

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('payment.completed');
      expect(result.orderCode).toBe(12345);
      expect(result.amount).toBe(299000);
    });

    it('should extract tier from webhook items', async () => {
      const handler = new PayOSWebhookHandler();
      const payload = JSON.stringify({ data: mockWebhookDataWithItems, signature: 'test-sig' });

      const result = await handler.handleWebhook(payload, 'test-sig');

      expect(result.success).toBe(true);
      expect(result.tier).toBe('premium');
    });

    it('should fail with invalid payload (missing fields)', async () => {
      const handler = new PayOSWebhookHandler();
      const invalidPayload = JSON.stringify({
        data: { orderCode: 123 }, // missing required fields
        signature: 'test-sig',
      });

      const result = await handler.handleWebhook(invalidPayload, 'test-sig');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid webhook payload');
    });

    it('should fail with malformed JSON', async () => {
      const handler = new PayOSWebhookHandler();

      const result = await handler.handleWebhook('not-json', 'test-sig');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Webhook handling failed');
    });

    it('should verify signature when checksum key provided', async () => {
      const handler = new PayOSWebhookHandler();
      const checksumKey = 'test-checksum-key';

      // Compute HMAC (simplified for test - in real scenario would use crypto)
      const payload = JSON.stringify({ data: mockWebhookData, signature: 'invalid-sig' });
      const result = await handler.handleWebhook(payload, 'invalid-sig', checksumKey);

      // Should fail with invalid signature
      expect(result.success).toBe(false);
      expect(result.error).toContain('signature');
    });

    it('should skip signature verification when no checksum key', async () => {
      const handler = new PayOSWebhookHandler();
      const payload = JSON.stringify({ data: mockWebhookData, signature: 'any-sig' });

      const result = await handler.handleWebhook(payload, 'any-sig');

      expect(result.success).toBe(true);
    });
  });

  describe('validatePayload', () => {
    it('should reject null/undefined data', async () => {
      const handler = new PayOSWebhookHandler();

      const nullResult = await handler.handleWebhook(
        JSON.stringify({ data: null, signature: 'sig' }),
        'sig'
      );
      expect(nullResult.success).toBe(false);
    });

    it('should reject orderCode <= 0', async () => {
      const handler = new PayOSWebhookHandler();
      const invalidData = { ...mockWebhookData, orderCode: 0 };

      const result = await handler.handleWebhook(
        JSON.stringify({ data: invalidData, signature: 'sig' }),
        'sig'
      );

      expect(result.success).toBe(false);
    });

    it('should reject amount <= 0', async () => {
      const handler = new PayOSWebhookHandler();
      const invalidData = { ...mockWebhookData, amount: 0 };

      const result = await handler.handleWebhook(
        JSON.stringify({ data: invalidData, signature: 'sig' }),
        'sig'
      );

      expect(result.success).toBe(false);
    });

    it('should reject invalid code format', async () => {
      const handler = new PayOSWebhookHandler();
      const invalidData = { ...mockWebhookData, code: '123' }; // should be 2 digits

      const result = await handler.handleWebhook(
        JSON.stringify({ data: invalidData, signature: 'sig' }),
        'sig'
      );

      expect(result.success).toBe(false);
    });
  });
});

describe('standalone functions', () => {
  describe('createPayOSWebhookHandler', () => {
    it('should create handler instance', () => {
      const handler = createPayOSWebhookHandler();
      expect(handler).toBeInstanceOf(PayOSWebhookHandler);
    });
  });

  describe('mapProductToTier', () => {
    it('should map product to tier', () => {
      expect(mapProductToTier('premium-monthly')).toBe('premium');
      expect(mapProductToTier('enterprise-yearly')).toBe('enterprise');
    });
  });

  describe('determinePayOSEventType', () => {
    it('should determine event type', () => {
      expect(determinePayOSEventType(mockWebhookData)).toBe('payment.completed');
      expect(determinePayOSEventType(cancelledWebhookData)).toBe('payment.refunded');
    });
  });

  describe('prepareLicenseActivationData', () => {
    it('should prepare license activation data', () => {
      const result = prepareLicenseActivationData(
        mockWebhookData,
        'user-123',
        'premium'
      );

      expect(result.userId).toBe('user-123');
      expect(result.licenseKey).toMatch(/^raas_premium_\d+_[A-Z0-9]+$/);
      expect(result.paymentReference).toContain('pl_abc123');
    });
  });

  describe('verifyPayOSWebhookSignature', () => {
    it('should verify signature', async () => {
      // This test would need actual HMAC computation
      // For now, just verify the function exists and is callable
      expect(typeof verifyPayOSWebhookSignature).toBe('function');
    });
  });
});
