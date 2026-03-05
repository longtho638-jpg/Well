/**
 * Unit Tests for auth-token-utils.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
  getTokenExpiresIn,
  decodeJWT,
  isJWTExpired,
  getJWTRemainingTime
} from '../auth-token-utils';
import { secureTokenStorage } from '../../secure-token-storage';

// Mock secureTokenStorage
vi.mock('../../secure-token-storage', () => ({
  secureTokenStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getExpiresAt: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setExpiresAt: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('auth-token-utils', () => {
  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000, // 1 hour from now
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setTokens', () => {
    it('should store access token, refresh token, and expiresAt', () => {
      setTokens(mockTokens);

      expect(secureTokenStorage.setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(secureTokenStorage.setRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
      expect(secureTokenStorage.setExpiresAt).toHaveBeenCalledWith(mockTokens.expiresAt);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', () => {
      vi.mocked(secureTokenStorage.getAccessToken).mockReturnValue('stored-access-token');

      const result = getAccessToken();

      expect(result).toBe('stored-access-token');
      expect(secureTokenStorage.getAccessToken).toHaveBeenCalled();
    });

    it('should return null when no access token stored', () => {
      vi.mocked(secureTokenStorage.getAccessToken).mockReturnValue(null);

      const result = getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from storage', () => {
      vi.mocked(secureTokenStorage.getRefreshToken).mockReturnValue('stored-refresh-token');

      const result = getRefreshToken();

      expect(result).toBe('stored-refresh-token');
      expect(secureTokenStorage.getRefreshToken).toHaveBeenCalled();
    });

    it('should return null when no refresh token stored', () => {
      vi.mocked(secureTokenStorage.getRefreshToken).mockReturnValue(null);

      const result = getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear all stored tokens', () => {
      clearTokens();

      expect(secureTokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no expiry stored', () => {
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(null);

      const result = isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when expiry is in the past', () => {
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(Date.now() - 1000);

      const result = isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false when expiry is in the future', () => {
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(Date.now() + 3600000);

      const result = isTokenExpired();

      expect(result).toBe(false);
    });
  });

  describe('getTokenExpiresIn', () => {
    it('should return 0 when no expiry stored', () => {
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(null);

      const result = getTokenExpiresIn();

      expect(result).toBe(0);
    });

    it('should return 0 when expiry is in the past', () => {
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(Date.now() - 1000);

      const result = getTokenExpiresIn();

      expect(result).toBe(0);
    });

    it('should return remaining time in milliseconds when expiry is in the future', () => {
      const futureTime = Date.now() + 3600000;
      vi.mocked(secureTokenStorage.getExpiresAt).mockReturnValue(futureTime);

      const result = getTokenExpiresIn();

      expect(result).toBeGreaterThan(3599000);
      expect(result).toBeLessThanOrEqual(3600000);
    });
  });
});

describe('decodeJWT', () => {
  it('should decode valid JWT payload', () => {
    const payload = { sub: 'user-123', exp: Date.now() / 1000 + 3600 };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    const token = `${header}.${payloadEncoded}.${signature}`;

    const result = decodeJWT(token);

    expect(result).toEqual(payload);
  });

  it('should handle URL-safe base64 encoding (replace - with +, _ with /)', () => {
    const payload = { sub: 'user-456' };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    let payloadEncoded = btoa(JSON.stringify(payload));
    payloadEncoded = payloadEncoded.replace(/\+/g, '-').replace(/\//g, '_');
    const signature = 'mock-signature';
    const token = `${header}.${payloadEncoded}.${signature}`;

    const result = decodeJWT(token);

    expect(result).toEqual(payload);
  });

  it('should return null for invalid JWT format (wrong number of parts)', () => {
    expect(decodeJWT('invalid-token')).toBeNull();
    expect(decodeJWT('only.two')).toBeNull();
    expect(decodeJWT('')).toBeNull();
  });

  it('should return null for malformed JWT payload', () => {
    const token = 'header.invalid-base64.signature';

    const result = decodeJWT(token);

    expect(result).toBeNull();
  });
});

describe('isJWTExpired', () => {
  it('should return true for invalid token', () => {
    expect(isJWTExpired('invalid-token')).toBe(true);
  });

  it('should return true when JWT exp is in the past', () => {
    const payload = { sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 100 };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const token = `${header}.${payloadEncoded}.signature`;

    expect(isJWTExpired(token)).toBe(true);
  });

  it('should return false when JWT exp is in the future', () => {
    const payload = { sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const token = `${header}.${payloadEncoded}.signature`;

    expect(isJWTExpired(token)).toBe(false);
  });
});

describe('getJWTRemainingTime', () => {
  it('should return 0 for invalid token', () => {
    expect(getJWTRemainingTime('invalid-token')).toBe(0);
  });

  it('should return 0 when JWT exp is in the past', () => {
    const payload = { sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 100 };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const token = `${header}.${payloadEncoded}.signature`;

    expect(getJWTRemainingTime(token)).toBe(0);
  });

  it('should return remaining time in milliseconds when JWT exp is in the future', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = { sub: 'user-123', exp: futureExp };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const token = `${header}.${payloadEncoded}.signature`;

    const result = getJWTRemainingTime(token);

    expect(result).toBeGreaterThan(3599000);
    expect(result).toBeLessThanOrEqual(3600000);
  });
});
