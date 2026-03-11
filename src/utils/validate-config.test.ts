import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConfig } from './validate-config';

describe('validateConfig', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return valid state when all keys are present', () => {
    const mockEnv = {
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
      VITE_SUPABASE_URL: 'test-url',
      PROD: false,
    };

    const result = validateConfig(mockEnv);
    expect(result.isValid).toBe(false);
    expect(result.missingKeys).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('should return invalid state in production if keys are missing', () => {
    const mockEnv = {
      PROD: true,
    };

    const result = validateConfig(mockEnv);
    expect(result.isValid).toBe(false);
    expect(result.missingKeys.length).toBeGreaterThan(0);
  });
});
