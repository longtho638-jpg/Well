import { describe, it, expect, beforeEach } from 'vitest';
import RateLimiter, { commandRateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000, // 1 second for testing
    });
  });

  describe('isAllowed', () => {
    it('should allow requests under the limit', () => {
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests over the limit', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should track different users separately', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
      expect(limiter.isAllowed('user2')).toBe(true);
    });

    it('should reset after time window', async () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
      
      // Wait for window to pass
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining count', () => {
      expect(limiter.getRemaining('user1')).toBe(3);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemaining('user1')).toBe(2);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemaining('user1')).toBe(1);
      
      limiter.isAllowed('user1');
      expect(limiter.getRemaining('user1')).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return time until reset', () => {
      limiter.isAllowed('user1');
      
      const resetTime = limiter.getResetTime('user1');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(1000);
    });

    it('should return 0 for users with no requests', () => {
      expect(limiter.getResetTime('newUser')).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear limits for specific user', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      
      expect(limiter.isAllowed('user1')).toBe(false);
      
      limiter.reset('user1');
      
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('should clear all limits', () => {
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      limiter.isAllowed('user2');
      limiter.isAllowed('user2');
      
      limiter.resetAll();
      
      expect(limiter.getRemaining('user1')).toBe(3);
      expect(limiter.getRemaining('user2')).toBe(3);
    });
  });
});

describe('commandRateLimiter', () => {
  beforeEach(() => {
    commandRateLimiter.resetAll();
  });

  it('should be configured with 10 requests per minute', () => {
    const user = 'testUser';
    
    // Should allow 10 requests
    for (let i = 0; i < 10; i++) {
      expect(commandRateLimiter.isAllowed(user, `/test-${i}`)).toBe(true);
    }
    
    // 11th should be blocked
    expect(commandRateLimiter.isAllowed(user, '/test-11')).toBe(false);
  });
});
