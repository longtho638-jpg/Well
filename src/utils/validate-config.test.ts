import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConfig } from './validate-config';

describe('validateConfig', () => {
  beforeEach(() => {
    // Mock console.error to keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid state when all keys are present', () => {
    // Setup env vars
    const mockEnv = {
      VITE_FIREBASE_API_KEY: 'test-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-domain',
      VITE_FIREBASE_PROJECT_ID: 'test-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender',
      VITE_FIREBASE_APP_ID: 'test-app-id',
      VITE_SUPABASE_URL: 'test-url',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_API_URL: 'http://localhost:3000',
      PROD: false,
    };

    const result = validateConfig(mockEnv);
    expect(result.isValid).toBe(true);
    expect(result.missingKeys).toHaveLength(0);
  });

  it('should detect missing keys', () => {
    const mockEnv = {
      VITE_FIREBASE_API_KEY: 'test-key',
      // Missing other keys
      PROD: false,
    };

    const result = validateConfig(mockEnv);
    expect(result.isValid).toBe(false);
    expect(result.missingKeys).toContain('VITE_FIREBASE_AUTH_DOMAIN');
    expect(console.error).toHaveBeenCalled();
  });

  it('should return invalid state and log error in production if keys are missing', () => {
     const mockEnv = {
      PROD: true, // Production mode
      // Missing keys
    };

    const result = validateConfig(mockEnv);
    expect(result.isValid).toBe(false);
    expect(result.missingKeys.length).toBeGreaterThan(0);
    expect(console.error).toHaveBeenCalled();
  });
});
