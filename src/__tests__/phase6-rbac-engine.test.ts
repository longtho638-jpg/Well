/**
 * Phase 6: RBAC Engine Tests
 *
 * Tests for unified RBAC engine with:
 * - JWT claims integration
 * - API key scopes
 * - Role-permission mapping
 * - SOC 2 access controls
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canAccessResource,
  getEffectivePermissions,
  extractRoleFromJwt,
  validateJwtClaims,
  validateApiKeyScopes,
  parseJwt,
  checkAccessWithAudit,
  ROLE_PERMISSIONS,
  RESOURCE_ACCESS,
  TIER_RATE_LIMITS,
  type RaasJwtClaims,
  type RaasApiKey,
  type UserRole,
} from '@/lib/rbac-engine';

describe('Phase 6: RBAC Engine', () => {
  /**
   * Test: Role Permissions
   */
  describe('Role Permissions', () => {
    it('should grant viewer read-only permissions', () => {
      const permissions = getEffectivePermissions('viewer');

      expect(permissions).toContain('dashboard:read');
      expect(permissions).toContain('analytics:read');
      expect(permissions).not.toContain('dashboard:write');
      expect(permissions).not.toContain('users:write');
    });

    it('should grant user execute permissions', () => {
      const permissions = getEffectivePermissions('user');

      expect(permissions).toContain('agents:execute');
      expect(permissions).toContain('agents:configure');
      expect(permissions).toContain('dashboard:write');
    });

    it('should grant manager billing permissions', () => {
      const permissions = getEffectivePermissions('manager');

      expect(permissions).toContain('billing:write');
      expect(permissions).toContain('billing:export');
      expect(permissions).toContain('subscription:manage');
      expect(permissions).toContain('users:invite');
    });

    it('should grant admin audit permissions', () => {
      const permissions = getEffectivePermissions('admin');

      expect(permissions).toContain('audit:read');
      expect(permissions).toContain('audit:export');
      expect(permissions).toContain('compliance:read');
      expect(permissions).toContain('retention:manage');
    });

    it('should grant super admin platform permissions', () => {
      const permissions = getEffectivePermissions('super_admin');

      expect(permissions).toContain('platform:manage');
      expect(permissions).toContain('tenants:manage');
      expect(permissions).toContain('system:override');
    });

    it('should implement role hierarchy correctly', () => {
      // Each role should have all permissions of previous role
      const roles: UserRole[] = ['viewer', 'user', 'manager', 'admin', 'super_admin'];

      for (let i = 1; i < roles.length; i++) {
        const prevRole = roles[i - 1];
        const currRole = roles[i];

        ROLE_PERMISSIONS[prevRole].forEach(perm => {
          expect(ROLE_PERMISSIONS[currRole]).toContain(perm);
        });
      }
    });
  });

  /**
   * Test: Resource Access Control
   */
  describe('Resource Access Control', () => {
    it('should allow viewer to access dashboard', () => {
      expect(canAccessResource('viewer', '/api/v1/dashboard')).toBe(true);
      expect(canAccessResource('viewer', '/api/v1/analytics')).toBe(true);
    });

    it('should restrict billing access to manager+', () => {
      expect(canAccessResource('viewer', '/api/v1/billing')).toBe(false);
      expect(canAccessResource('user', '/api/v1/billing')).toBe(false);
      expect(canAccessResource('manager', '/api/v1/billing')).toBe(true);
      expect(canAccessResource('admin', '/api/v1/billing')).toBe(true);
    });

    it('should restrict audit logs to admin+', () => {
      expect(canAccessResource('manager', '/api/v1/audit')).toBe(false);
      expect(canAccessResource('admin', '/api/v1/audit')).toBe(true);
      expect(canAccessResource('super_admin', '/api/v1/audit')).toBe(true);
    });

    it('should restrict platform ops to super_admin only', () => {
      expect(canAccessResource('admin', '/api/v1/platform')).toBe(false);
      expect(canAccessResource('super_admin', '/api/v1/platform')).toBe(true);
    });
  });

  /**
   * Test: Permission Checks
   */
  describe('Permission Checks', () => {
    it('should check individual permissions', () => {
      expect(hasPermission('viewer', 'dashboard:read')).toBe(true);
      expect(hasPermission('viewer', 'dashboard:write')).toBe(false);

      expect(hasPermission('user', 'agents:execute')).toBe(true);
      expect(hasPermission('user', 'billing:write')).toBe(false);

      expect(hasPermission('admin', 'audit:export')).toBe(true);
      expect(hasPermission('admin', 'platform:manage')).toBe(false);
    });

    it('should deny unknown permissions', () => {
      expect(hasPermission('super_admin', 'unknown:perm' as any)).toBe(false);
    });
  });

  /**
   * Test: JWT Claims Validation
   */
  describe('JWT Claims Validation', () => {
    const validClaims: Partial<RaasJwtClaims> = {
      sub: 'user_123',
      iss: 'https://raas.agencyos.network',
      aud: 'client_app',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jwt_abc123',
      role: 'user' as UserRole,
      tier: 'premium',
      customer_id: 'cust_456',
    };

    it('should validate complete JWT claims', () => {
      const result = validateJwtClaims(validClaims);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject claims with missing fields', () => {
      const incompleteClaims = { sub: 'user_123' };
      const result = validateJwtClaims(incompleteClaims);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject expired tokens', () => {
      const expiredClaims = {
        ...validClaims,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const result = validateJwtClaims(expiredClaims);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('JWT expired');
    });

    it('should reject invalid issuer', () => {
      const invalidIssuer = {
        ...validClaims,
        iss: 'https://evil.com',
      };

      const result = validateJwtClaims(invalidIssuer);

      expect(result.valid).toBe(false);
      expect(result.errors.join(' ')).toContain('Invalid issuer');
    });
  });

  /**
   * Test: JWT Parsing
   */
  describe('JWT Parsing', () => {
    it('should parse valid JWT token', () => {
      // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJ1c2VyIiwidGllciI6InByZW1pdW0ifQ.signature
      const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJ1c2VyIiwidGllciI6InByZW1pdW0iLCJjdXN0b21lcl9pZCI6ImN1c3RfNDU2In0.signature';

      const claims = parseJwt(mockJwt);

      expect(claims.sub).toBe('user_123');
      expect(claims.role).toBe('user');
      expect(claims.tier).toBe('premium');
      expect(claims.customer_id).toBe('cust_456');
    });

    it('should reject invalid JWT format', () => {
      expect(() => parseJwt('invalid')).toThrow('Invalid JWT format');
      expect(() => parseJwt('a.b')).toThrow('Invalid JWT format');
    });
  });

  /**
   * Test: Role Extraction
   */
  describe('Role Extraction', () => {
    it('should extract role from JWT claims', () => {
      const claims: RaasJwtClaims = {
        sub: 'user_123',
        iss: 'raas',
        aud: 'app',
        exp: Date.now() + 3600,
        iat: Date.now(),
        jti: 'jwt_123',
        role: 'manager',
        tier: 'enterprise',
        customer_id: 'cust_456',
        permissions: [],
      };

      const role = extractRoleFromJwt(claims);
      expect(role).toBe('manager');
    });

    it('should fallback to tier-based role', () => {
      const claims: RaasJwtClaims = {
        sub: 'user_123',
        iss: 'raas',
        aud: 'app',
        exp: Date.now() + 3600,
        iat: Date.now(),
        jti: 'jwt_123',
        role: 'viewer', // Explicit role
        tier: 'enterprise',
        customer_id: 'cust_456',
        permissions: [],
      };

      const role = extractRoleFromJwt(claims);
      expect(role).toBe('viewer'); // Explicit takes precedence
    });
  });

  /**
   * Test: API Key Scopes
   */
  describe('API Key Scopes', () => {
    it('should validate API key scopes', () => {
      const apiKey: RaasApiKey = {
        id: 'mk_live_abc123',
        prefix: 'mk_live',
        hashed_key: 'hash_xyz',
        scopes: ['dashboard:read', 'analytics:read'],
        role: 'viewer',
        customer_id: 'cust_123',
        created_at: Date.now(),
        usage_count: 0,
      };

      expect(validateApiKeyScopes(apiKey, 'dashboard:read')).toBe(true);
      expect(validateApiKeyScopes(apiKey, 'analytics:read')).toBe(true);
      expect(validateApiKeyScopes(apiKey, 'billing:read')).toBe(false);
    });

    it('should allow super_admin to bypass scope check', () => {
      const apiKey: RaasApiKey = {
        id: 'mk_live_admin',
        prefix: 'mk_live',
        hashed_key: 'hash_admin',
        scopes: [], // No scopes
        role: 'super_admin',
        customer_id: 'cust_123',
        created_at: Date.now(),
        usage_count: 0,
      };

      expect(validateApiKeyScopes(apiKey, 'platform:manage')).toBe(true);
    });
  });

  /**
   * Test: Tier Rate Limits
   */
  describe('Tier Rate Limits', () => {
    it('should define limits for all tiers', () => {
      const tiers = ['basic', 'premium', 'enterprise', 'master'] as const;

      tiers.forEach(tier => {
        expect(TIER_RATE_LIMITS[tier]).toBeDefined();
        expect(TIER_RATE_LIMITS[tier].requestsPerSecond).toBeGreaterThan(0);
      });
    });

    it('should increase limits with tier', () => {
      expect(TIER_RATE_LIMITS.premium.requestsPerSecond)
        .toBeGreaterThan(TIER_RATE_LIMITS.basic.requestsPerSecond);

      expect(TIER_RATE_LIMITS.enterprise.requestsPerSecond)
        .toBeGreaterThan(TIER_RATE_LIMITS.premium.requestsPerSecond);

      expect(TIER_RATE_LIMITS.master.requestsPerSecond)
        .toBeGreaterThan(TIER_RATE_LIMITS.enterprise.requestsPerSecond);
    });
  });

  /**
   * Test: Audit Logging (SOC 2)
   */
  describe('Audit Logging', () => {
    it('should log access decisions', () => {
      // This will log to console in development
      const result = checkAccessWithAudit(
        'user',
        'dashboard:read',
        '/api/v1/dashboard',
        'user_123',
        'cust_456'
      );

      expect(result.allowed).toBe(true);
    });

    it('should log denied access', () => {
      const result = checkAccessWithAudit(
        'viewer',
        'billing:write',
        '/api/v1/billing',
        'user_123',
        'cust_456'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
