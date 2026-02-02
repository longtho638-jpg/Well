import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Admin Check Utility', () => {
  let isAdmin: (email: string | null | undefined) => boolean;

  beforeEach(async () => {
    // Reset modules to ensure environment variables are re-read
    vi.resetModules();

    // Mock environment variable
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin1@example.com, admin2@example.com');

    // Import the module dynamically to pick up the stubbed env var
    const module = await import('./admin-check');
    isAdmin = module.isAdmin;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return true for valid admin email', () => {
    expect(isAdmin('admin1@example.com')).toBe(true);
  });

  it('should return true for admin email with different casing', () => {
    expect(isAdmin('ADMIN2@Example.com')).toBe(true);
  });

  it('should return true for admin email with whitespace', () => {
    expect(isAdmin('  admin1@example.com  ')).toBe(true);
  });

  it('should return false for non-admin email', () => {
    expect(isAdmin('user@example.com')).toBe(false);
  });

  it('should return false for null or undefined email', () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isAdmin('')).toBe(false);
  });

  it('should handle empty environment variable gracefully', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_ADMIN_EMAILS', '');
    const module = await import('./admin-check');
    const emptyAdminCheck = module.isAdmin;

    expect(emptyAdminCheck('admin1@example.com')).toBe(false);
  });
});
