/**
 * Unit Tests for auth-permissions.ts
 */

import { describe, it, expect } from 'vitest';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '../auth-permissions';
import type { Permission } from '../auth-types';

describe('auth-permissions', () => {
  describe('hasPermission', () => {
    describe('user role', () => {
      it('should have read:products permission', () => {
        expect(hasPermission('user', 'read:products')).toBe(true);
      });

      it('should have read:orders permission', () => {
        expect(hasPermission('user', 'read:orders')).toBe(true);
      });

      it('should NOT have write:orders permission', () => {
        expect(hasPermission('user', 'write:orders')).toBe(false);
      });
    });

    describe('distributor role', () => {
      it('should have read:products permission', () => {
        expect(hasPermission('distributor', 'read:products')).toBe(true);
      });

      it('should have write:orders permission', () => {
        expect(hasPermission('distributor', 'write:orders')).toBe(true);
      });

      it('should have read:analytics permission', () => {
        expect(hasPermission('distributor', 'read:analytics')).toBe(true);
      });
    });

    describe('vendor role', () => {
      it('should have vendor:manage-products permission', () => {
        expect(hasPermission('vendor', 'vendor:manage-products')).toBe(true);
      });

      it('should have write:orders permission', () => {
        expect(hasPermission('vendor', 'write:orders')).toBe(true);
      });
    });

    describe('admin role', () => {
      it('should have all permissions via admin:all wildcard', () => {
        expect(hasPermission('admin', 'read:products')).toBe(true);
        expect(hasPermission('admin', 'write:orders')).toBe(true);
        expect(hasPermission('admin', 'vendor:manage-products')).toBe(true);
        expect(hasPermission('admin', 'read:products' as Permission)).toBe(true);
      });
    });

    describe('unknown role', () => {
      it('should return false for unknown role', () => {
        expect(hasPermission('unknown', 'read:products')).toBe(false);
      });

      it('should return false for empty role', () => {
        expect(hasPermission('', 'read:products')).toBe(false);
      });
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all requested permissions', () => {
      const permissions: Permission[] = ['read:products', 'read:orders'];
      expect(hasAllPermissions('user', permissions)).toBe(true);
    });

    it('should return false when user missing at least one permission', () => {
      const permissions: Permission[] = ['read:products', 'write:orders'];
      expect(hasAllPermissions('user', permissions)).toBe(false);
    });

    it('should return true for admin with any permissions', () => {
      const permissions: Permission[] = ['read:products', 'write:orders', 'vendor:manage-products'];
      expect(hasAllPermissions('admin', permissions)).toBe(true);
    });

    it('should return true for empty permissions array', () => {
      expect(hasAllPermissions('user', [])).toBe(true);
    });

    it('should return true for distributor with distributor permissions', () => {
      const permissions: Permission[] = ['read:products', 'write:orders', 'read:analytics'];
      expect(hasAllPermissions('distributor', permissions)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one requested permission', () => {
      const permissions: Permission[] = ['read:products', 'write:orders'];
      expect(hasAnyPermission('user', permissions)).toBe(true);
    });

    it('should return false when user has none of the requested permissions', () => {
      const permissions: Permission[] = ['write:orders', 'vendor:manage-products'];
      expect(hasAnyPermission('user', permissions)).toBe(false);
    });

    it('should return true for admin with any permissions', () => {
      const permissions: Permission[] = ['vendor:manage-products', 'read:analytics' as Permission];
      expect(hasAnyPermission('admin', permissions)).toBe(true);
    });

    it('should return false for empty permissions array', () => {
      expect(hasAnyPermission('user', [])).toBe(false);
    });

    it('should return true for distributor with mixed permissions', () => {
      const permissions: Permission[] = ['write:orders', 'vendor:manage-products'];
      expect(hasAnyPermission('distributor', permissions)).toBe(true);
    });
  });
});
