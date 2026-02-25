import { describe, it, expect } from 'vitest';
import { isPayOSConfigured } from '../payos-client';

/**
 * PayOS Client Service Tests
 *
 * Note: PayOS operations now use Supabase Edge Functions for security.
 * All payment credentials are stored server-side in Supabase Vault.
 * Integration tests require a configured Supabase project with Edge Functions deployed.
 *
 * This test file focuses on client-side configuration checks only.
 */

describe('PayOS Client Service', () => {
  describe('isPayOSConfigured', () => {
    it('should return boolean', () => {
      const result = isPayOSConfigured();
      expect(typeof result).toBe('boolean');
    });

    it('should always return true (server-side configuration)', () => {
      // With Edge Functions, configuration is always server-side
      const result = isPayOSConfigured();
      expect(result).toBe(true);
    });
  });

  describe('module structure', () => {
    it('should export isPayOSConfigured as named export', () => {
      expect(typeof isPayOSConfigured).toBe('function');
    });
  });
});
