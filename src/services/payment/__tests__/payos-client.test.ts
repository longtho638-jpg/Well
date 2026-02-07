import { describe, it, expect } from 'vitest';
import { isPayOSConfigured } from '../payos-client';

/**
 * PayOS Client Service Tests
 *
 * Note: Full integration tests for createPayment, getPaymentStatus, cancelPayment,
 * and verifyWebhook require PayOS environment variables (VITE_PAYOS_*) which are
 * not available in CI. These are tested manually and in E2E tests with real credentials.
 *
 * This test file focuses on configuration checks only.
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

  describe('module structure', () => {
    it('should export isPayOSConfigured as named export', () => {
      expect(typeof isPayOSConfigured).toBe('function');
    });
  });
});
