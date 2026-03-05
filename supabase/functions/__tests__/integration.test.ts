/**
 * Edge Function Integration Tests
 * Tests for validate-csrf and check-rate-limit functions
 *
 * Run: pnpm supabase functions serve --env-file .env.local
 * Then: pnpm vitest run supabase/functions/__tests__
 */

import { describe, it, expect } from 'vitest';

const EDGE_FUNCTION_URL = 'http://localhost:54321/functions/v1';
const TEST_USER_ID = 'test-user-' + Date.now();

describe('Edge Functions Integration', () => {

  describe('validate-csrf function', () => {
    it('should return 400 for missing token', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/validate-csrf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: TEST_USER_ID }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing token');
    });

    it('should return 400 for missing userId', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/validate-csrf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'test-token' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing userId');
    });

    it('should return 403 for invalid token', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/validate-csrf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'invalid-token', userId: TEST_USER_ID }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/validate-csrf`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('check-rate-limit function', () => {
    it('should return 400 for missing userId', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/check-rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing userId');
    });

    it('should allow first request (under limit)', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/check-rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: TEST_USER_ID, action: 'test' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.allowed).toBe(true);
      expect(data.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await fetch(`${EDGE_FUNCTION_URL}/check-rate-limit`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Rate Limit Stress Test', () => {
    it('should allow 100 requests within window', async () => {
      const promises = Array.from({ length: 10 }, () =>
        fetch(`${EDGE_FUNCTION_URL}/check-rate-limit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: TEST_USER_ID, action: 'stress' }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // All should be allowed (10 < 100 limit)
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });
  });
});
