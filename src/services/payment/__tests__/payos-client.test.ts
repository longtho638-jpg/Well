import { describe, it, expect } from 'vitest';
import { isPayOSConfigured } from '../payos-client';

/**
 * PayOS Client Service Tests
 *
 * Note: Full integration tests for createPayment, getPaymentStatus, cancelPayment,
 * and verifyWebhook require PayOS environment variables (VITE_PAYOS_*) which are
 * not available in CI. These are tested manually and in E2E tests with real credentials.
 *
 * This test file focuses on:
 * 1. Configuration check function
 * 2. Module export verification
 */

describe('PayOS Client Service', () => {
  describe('isPayOSConfigured', () => {
    it('should return boolean', () => {
      const result = isPayOSConfigured();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when env vars are not set', () => {
      // In test environment without VITE_PAYOS_* vars, should return false
      const result = isPayOSConfigured();
      expect(result).toBe(false);
    });
  });

  describe('module exports', () => {
    it('should export all required functions', async () => {
      const module = await import('../payos-client');

      expect(typeof module.createPayment).toBe('function');
      expect(typeof module.getPaymentStatus).toBe('function');
      expect(typeof module.cancelPayment).toBe('function');
      expect(typeof module.verifyWebhook).toBe('function');
      expect(typeof module.isPayOSConfigured).toBe('function');
    });

    it('should have default export with all functions', async () => {
      const module = await import('../payos-client');

      expect(module.default).toBeDefined();
      expect(typeof module.default.createPayment).toBe('function');
      expect(typeof module.default.getPaymentStatus).toBe('function');
      expect(typeof module.default.cancelPayment).toBe('function');
      expect(typeof module.default.verifyWebhook).toBe('function');
      expect(typeof module.default.isPayOSConfigured).toBe('function');
    });
  });
});
