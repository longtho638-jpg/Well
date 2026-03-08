/**
 * RaaS RBAC Engine - Phase 6 Security & Compliance
 *
 * Unified Role-Based Access Control with:
 * - JWT claims integration
 * - API key scopes enforcement
 * - Granular permission mapping
 * - SOC 2 compliant access control
 *
 * @see {@link https://raas.agencyos.network/docs/rbac}
 */

import type { LicenseValidationResult } from './raas-gate';

/**
 * JWT issuer domain - configurable via environment variable
 * Default: raas.agencyos.network
 */
const JWT_ISSUER_DOMAIN = process.env.RAAS_JWT_ISSUER || 'raas.agencyos.network';

/**
 * JWT Claims interface for RaaS authentication
 */
export interface RaasJwtClaims {
  sub: string;          // Subject (user ID)
  iss: string;          // Issuer (raas.agencyos.network)
  aud: string;          // Audience (client ID)
  exp: number;          // Expiration time
  iat: number;          // Issued at
  jti: string;          // JWT ID (unique identifier)
  role: UserRole;       // User role
  permissions: string[]; // Explicit permissions
  tier: LicenseTier;    // License tier
  customer_id: string;  // Customer/organization ID
  scope?: string[];     // OAuth2 scopes
  // Multi-tenant license enforcement (Phase 6.3)
  tenant_id?: string;       // Tenant identifier for multi-tenant isolation
  tenant_policy_id?: string; // Tenant policy reference for custom limits
}

/**
 * API Key structure with scopes
 */
export interface RaasApiKey {
  id: string;           // api_key_xxx
  prefix: 'mk_live' | 'mk_test' | 'mk_prod';
  hashed_key: string;   // SHA-256 hashed
  scopes: string[];     // Allowed scopes
  role: UserRole;       // Associated role
  customer_id: string;  // Owner customer ID
  created_at: number;   // Unix timestamp
  expires_at?: number;  // Optional expiration
  last_used_at?: number; // Last usage timestamp
  usage_count: number;  // Total API calls
  rate_limit?: RateLimitConfig; // Custom rate limit
}

/**
 * User roles hierarchy (ascending order of privilege)
 */
export type UserRole =
  | 'viewer'      // Read-only access
  | 'user'        // Standard user (read + write own resources)
  | 'manager'     // Team manager (read + write + billing)
  | 'admin'       // Full organization access
  | 'super_admin'; // Platform-wide access (AgencyOS only)

/**
 * License tiers mapping to roles
 */
export type LicenseTier =
  | 'basic'      // Free tier - viewer role
  | 'premium'    // Paid tier - user/manager role
  | 'enterprise' // Enterprise - admin role
  | 'master';    // AgencyOS - super_admin role

/**
 * Rate limit configuration per tier
 */
export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;       // Max requests in 1 second burst
  concurrentRequests: number; // Max concurrent connections
}

/**
 * Permission definitions for RBAC
 */
export const PERMISSIONS = {
  // Dashboard & Analytics
  'dashboard:read': 'View dashboard',
  'dashboard:write': 'Modify dashboard widgets',
  'analytics:read': 'View analytics',
  'analytics:export': 'Export analytics data',

  // Agent Operations
  'agents:execute': 'Execute AI agents',
  'agents:configure': 'Configure agent parameters',
  'agents:view_logs': 'View agent execution logs',

  // Billing & Subscription
  'billing:read': 'View billing info',
  'billing:write': 'Update payment methods',
  'billing:export': 'Export invoices',
  'subscription:manage': 'Manage subscription',

  // User Management
  'users:read': 'View team members',
  'users:write': 'Add/edit team members',
  'users:delete': 'Remove team members',
  'users:invite': 'Send invitations',

  // API & Integrations
  'apikeys:read': 'View API keys',
  'apikeys:create': 'Create API keys',
  'apikeys:revoke': 'Revoke API keys',
  'webhooks:manage': 'Manage webhooks',

  // Admin (SOC 2)
  'audit:read': 'View audit logs',
  'audit:export': 'Export audit trails',
  'compliance:read': 'View compliance reports',
  'retention:manage': 'Manage data retention',

  // Super Admin (Platform)
  'platform:manage': 'Platform-wide administration',
  'tenants:manage': 'Manage customer tenants',
  'system:override': 'Override system limits',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  viewer: [
    'dashboard:read',
    'analytics:read',
    'billing:read',
    'users:read',
  ],
  user: [
    ...ROLE_PERMISSIONS.viewer,
    'dashboard:write',
    'agents:execute',
    'agents:configure',
    'agents:view_logs',
    'apikeys:read',
  ],
  manager: [
    ...ROLE_PERMISSIONS.user,
    'analytics:export',
    'billing:write',
    'billing:export',
    'subscription:manage',
    'users:write',
    'users:invite',
    'apikeys:create',
    'webhooks:manage',
  ],
  admin: [
    ...ROLE_PERMISSIONS.manager,
    'users:delete',
    'apikeys:revoke',
    'audit:read',
    'audit:export',
    'compliance:read',
    'retention:manage',
  ],
  super_admin: [
    ...ROLE_PERMISSIONS.admin,
    'platform:manage',
    'tenants:manage',
    'system:override',
  ],
};

/**
 * Default rate limits per license tier
 */
export const TIER_RATE_LIMITS: Record<LicenseTier, RateLimitConfig> = {
  basic: {
    requestsPerSecond: 1,
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    burstLimit: 3,
    concurrentRequests: 1,
  },
  premium: {
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 20,
    concurrentRequests: 5,
  },
  enterprise: {
    requestsPerSecond: 50,
    requestsPerMinute: 2000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    burstLimit: 100,
    concurrentRequests: 20,
  },
  master: {
    requestsPerSecond: 200,
    requestsPerMinute: 10000,
    requestsPerHour: 200000,
    requestsPerDay: 2000000,
    burstLimit: 500,
    concurrentRequests: 100,
  },
};

/**
 * Resource access control matrix
 */
export const RESOURCE_ACCESS: Record<string, UserRole[]> = {
  '/api/v1/dashboard': ['viewer', 'user', 'manager', 'admin', 'super_admin'],
  '/api/v1/analytics': ['viewer', 'user', 'manager', 'admin', 'super_admin'],
  '/api/v1/agents': ['user', 'manager', 'admin', 'super_admin'],
  '/api/v1/apikeys': ['user', 'manager', 'admin', 'super_admin'],
  '/api/v1/billing': ['manager', 'admin', 'super_admin'],
  '/api/v1/users': ['manager', 'admin', 'super_admin'],
  '/api/v1/audit': ['admin', 'super_admin'],
  '/api/v1/compliance': ['admin', 'super_admin'],
  '/api/v1/admin': ['admin', 'super_admin'],
  '/api/v1/platform': ['super_admin'],
};

/**
 * Check if user has permission
 */
export function hasPermission(
  role: UserRole,
  permission: PermissionKey
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if role can access resource path
 */
export function canAccessResource(role: UserRole, path: string): boolean {
  // Find matching resource pattern
  for (const [resourcePath, allowedRoles] of Object.entries(RESOURCE_ACCESS)) {
    if (path.startsWith(resourcePath)) {
      return allowedRoles.includes(role);
    }
  }
  // Default deny for unknown paths
  return false;
}

/**
 * Get effective permissions for a role
 */
export function getEffectivePermissions(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Extract role from JWT claims
 */
export function extractRoleFromJwt(claims: RaasJwtClaims): UserRole {
  // Explicit role in claims takes precedence
  if (claims.role) {
    return claims.role;
  }

  // Fallback to tier-based role mapping
  const tierRoleMap: Record<LicenseTier, UserRole> = {
    basic: 'viewer',
    premium: 'user',
    enterprise: 'manager',
    master: 'admin',
  };

  return tierRoleMap[claims.tier] || 'viewer';
}

/**
 * Extract role from API key
 */
export function extractRoleFromApiKey(apiKey: RaasApiKey): UserRole {
  return apiKey.role;
}

/**
 * Validate JWT claims structure
 */
export function validateJwtClaims(claims: Partial<RaasJwtClaims>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!claims.sub) errors.push('Missing subject (sub)');
  if (!claims.iss) errors.push('Missing issuer (iss)');
  if (!claims.aud) errors.push('Missing audience (aud)');
  if (!claims.exp) errors.push('Missing expiration (exp)');
  if (!claims.iat) errors.push('Missing issued at (iat)');
  if (!claims.jti) errors.push('Missing JWT ID (jti)');
  if (!claims.role && !claims.tier) errors.push('Missing role or tier');
  if (!claims.customer_id) errors.push('Missing customer_id');

  // Check expiration
  if (claims.exp && claims.exp < Date.now() / 1000) {
    errors.push('JWT expired');
  }

  // Validate issuer
  if (claims.iss && !claims.iss.includes('raas.agencyos.network')) {
    errors.push('Invalid issuer - must be from raas.agencyos.network');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate API key scopes against requested permission
 */
export function validateApiKeyScopes(
  apiKey: RaasApiKey,
  requiredScope: string
): boolean {
  // Super admin keys bypass scope check
  if (apiKey.role === 'super_admin') {
    return true;
  }

  return apiKey.scopes.includes(requiredScope);
}

/**
 * Parse JWT token and extract claims
 */
export function parseJwt(token: string): RaasJwtClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  try {
    const payload = JSON.parse(atob(parts[1]));
    return {
      sub: payload.sub,
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat,
      jti: payload.jti,
      role: payload.role || 'viewer',
      permissions: payload.permissions || [],
      tier: payload.tier || 'basic',
      customer_id: payload.customer_id,
      scope: payload.scope || [],
    };
  } catch (error) {
    throw new Error('Invalid JWT payload');
  }
}

/**
 * Create audit log entry for access control decisions
 */
export interface AuditLogEntry {
  timestamp: string;
  user_id: string;
  customer_id: string;
  action: string;
  resource: string;
  result: 'allowed' | 'denied';
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  request_id: string;
}

/**
 * SOC 2 Compliance: Log access control decisions
 */
export function logAccessDecision(entry: AuditLogEntry): void {
  // In production, this sends to audit log service
  // For now, console log (replace with proper audit service)
  console.log('[RBAC Audit]', JSON.stringify(entry));
}

/**
 * Check access with audit logging (SOC 2 compliant)
 */
export function checkAccessWithAudit(
  role: UserRole,
  permission: PermissionKey,
  resource: string,
  userId: string,
  customerId: string
): { allowed: boolean; reason?: string } {
  const hasPerm = hasPermission(role, permission);
  const canAccess = canAccessResource(role, resource);

  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    user_id: userId,
    customer_id: customerId,
    action: `${permission} on ${resource}`,
    resource,
    result: hasPerm && canAccess ? 'allowed' : 'denied',
    reason: hasPerm
      ? canAccess
        ? 'Authorized'
        : 'Resource access denied'
      : 'Permission denied',
    request_id: crypto.randomUUID(),
  };

  logAccessDecision(entry);

  return {
    allowed: hasPerm && canAccess,
    reason: entry.reason,
  };
}
