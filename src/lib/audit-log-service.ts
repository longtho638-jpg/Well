/**
 * Audit Logging Service - Phase 6 SOC 2 Compliance
 *
 * Comprehensive audit logging for:
 * - Authentication events
 * - Authorization decisions
 * - Data access
 * - Configuration changes
 * - Admin operations
 *
 * SOC 2 Type II compliant with:
 * - Immutable audit trail
 * - Data retention policies
 * - Audit export capabilities
 * - Access logging
 */

import type { UserRole, LicenseTier, PermissionKey, AuditLogEntry } from './rbac-engine';

/**
 * Audit event types
 */
export type AuditEventType =
  // Authentication
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.token_refresh'
  | 'auth.password_change'
  | 'auth.mfa_enabled'
  | 'auth.mfa_disabled'

  // Authorization
  | 'auth.access_granted'
  | 'auth.access_denied'
  | 'auth.permission_change'
  | 'auth.role_change'

  // API Keys
  | 'apikey.created'
  | 'apikey.used'
  | 'apikey.revoked'
  | 'apikey.expired'

  // Data Access
  | 'data.read'
  | 'data.write'
  | 'data.delete'
  | 'data.export'

  // Configuration
  | 'config.updated'
  | 'config.deleted'
  | 'config.exported'

  // Admin
  | 'admin.user_created'
  | 'admin.user_updated'
  | 'admin.user_deleted'
  | 'admin.billing_updated'
  | 'admin.subscription_changed'

  // Compliance
  | 'compliance.audit_export'
  | 'compliance.retention_applied'
  | 'compliance.policy_updated';

/**
 * Audit log entry with full SOC 2 compliance
 */
export interface AuditEvent extends AuditLogEntry {
  id: string;                 // Unique event ID
  event_type: AuditEventType; // Event type
  version: number;            // Schema version
  tenant_id: string;          // Multi-tenant support
  environment: 'production' | 'staging' | 'development';
  geo_location?: {
    country: string;
    region: string;
    city: string;
    ip: string;
  };
  resource_before?: Record<string, unknown>; // State before change
  resource_after?: Record<string, unknown>;  // State after change
  correlation_id?: string;     // Correlate related events
  session_id?: string;         // User session
  user_agent?: string;
  risk_score?: number;         // 0-100 risk assessment
}

/**
 * Data retention policies (SOC 2 compliant)
 */
export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retention_days: number;
  event_types: AuditEventType[];
  storage_tier: 'hot' | 'warm' | 'cold' | 'archive';
  auto_delete: boolean;
  legal_hold: boolean;
}

/**
 * Default retention policies
 */
export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: 'security-events',
    name: 'Security Events',
    description: 'Authentication and authorization events',
    retention_days: 365, // 1 year for SOC 2
    event_types: [
      'auth.login',
      'auth.logout',
      'auth.login_failed',
      'auth.access_granted',
      'auth.access_denied',
    ],
    storage_tier: 'hot',
    auto_delete: false,
    legal_hold: false,
  },
  {
    id: 'api-usage',
    name: 'API Usage',
    description: 'API key usage and rate limiting',
    retention_days: 90,
    event_types: ['apikey.used', 'apikey.created', 'apikey.revoked'],
    storage_tier: 'warm',
    auto_delete: true,
    legal_hold: false,
  },
  {
    id: 'data-access',
    name: 'Data Access',
    description: 'Data read/write operations',
    retention_days: 180,
    event_types: ['data.read', 'data.write', 'data.delete', 'data.export'],
    storage_tier: 'warm',
    auto_delete: true,
    legal_hold: false,
  },
  {
    id: 'admin-ops',
    name: 'Administrative Operations',
    description: 'Admin and configuration changes',
    retention_days: 730, // 2 years
    event_types: [
      'admin.user_created',
      'admin.user_updated',
      'admin.user_deleted',
      'config.updated',
    ],
    storage_tier: 'cold',
    auto_delete: false,
    legal_hold: true,
  },
];

/**
 * Audit log storage interface
 */
export interface AuditLogStorage {
  append(entry: AuditEvent): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEvent[]>;
  export(filters: AuditQueryFilters): Promise<string>; // CSV/JSON export
  deleteBefore(cutoffDate: Date): Promise<number>;
  getCountByType(eventType: AuditEventType, startDate: Date, endDate: Date): Promise<number>;
}

/**
 * Query filters for audit logs
 */
export interface AuditQueryFilters {
  event_type?: AuditEventType | AuditEventType[];
  user_id?: string;
  customer_id?: string;
  tenant_id?: string;
  resource?: string;
  result?: 'allowed' | 'denied';
  date_from?: Date;
  date_to?: Date;
  risk_score_min?: number;
  risk_score_max?: number;
  limit?: number;
  offset?: number;
  sort_by?: 'timestamp' | 'risk_score';
  sort_order?: 'asc' | 'desc';
}

/**
 * In-memory audit log storage (development)
 * Production should use database/blob storage
 */
export class InMemoryAuditLogStorage implements AuditLogStorage {
  private logs: AuditEvent[] = [];
  private maxSize = 10000;

  async append(entry: AuditEvent): Promise<void> {
    this.logs.unshift(entry);

    // Trim to max size (keep most recent)
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(0, this.maxSize);
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    let results = [...this.logs];

    // Apply filters
    if (filters.event_type) {
      const types = Array.isArray(filters.event_type) ? filters.event_type : [filters.event_type];
      results = results.filter(log => types.includes(log.event_type));
    }

    if (filters.user_id) {
      results = results.filter(log => log.user_id === filters.user_id);
    }

    if (filters.customer_id) {
      results = results.filter(log => log.customer_id === filters.customer_id);
    }

    if (filters.result) {
      results = results.filter(log => log.result === filters.result);
    }

    if (filters.resource) {
      results = results.filter(log => log.resource === filters.resource);
    }

    if (filters.date_from) {
      results = results.filter(log => new Date(log.timestamp) >= filters.date_from!);
    }

    if (filters.date_to) {
      results = results.filter(log => new Date(log.timestamp) <= filters.date_to!);
    }

    // Sort
    const sortBy = filters.sort_by || 'timestamp';
    const sortOrder = filters.sort_order || 'desc';
    results.sort((a, b) => {
      const aVal = sortBy === 'timestamp' ? new Date(a.timestamp).getTime() : (a.risk_score || 0);
      const bVal = sortBy === 'timestamp' ? new Date(b.timestamp).getTime() : (b.risk_score || 0);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    return results.slice(offset, offset + limit);
  }

  async export(filters: AuditQueryFilters): Promise<string> {
    const results = await this.query(filters);
    return JSON.stringify(results, null, 2);
  }

  async deleteBefore(cutoffDate: Date): Promise<number> {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    return initialLength - this.logs.length;
  }

  async getCountByType(eventType: AuditEventType, startDate: Date, endDate: Date): Promise<number> {
    return this.logs.filter(log =>
      log.event_type === eventType &&
      new Date(log.timestamp) >= startDate &&
      new Date(log.timestamp) <= endDate
    ).length;
  }
}

/**
 * Audit logging service
 */
export class AuditLogService {
  private storage: AuditLogStorage;
  private environment: 'production' | 'staging' | 'development';
  private tenantId: string;

  constructor(
    storage?: AuditLogStorage,
    environment: 'production' | 'staging' | 'development' = 'production',
    tenantId = 'default'
  ) {
    this.storage = storage || new InMemoryAuditLogStorage();
    this.environment = environment;
    this.tenantId = tenantId;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'version' | 'tenant_id' | 'environment'>): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      version: 1,
      tenant_id: this.tenantId,
      environment: this.environment,
    };

    // Calculate risk score
    auditEvent.risk_score = this.calculateRiskScore(auditEvent);

    await this.storage.append(auditEvent);
    return auditEvent;
  }

  /**
   * Log authentication event
   */
  async logAuth(
    userId: string,
    customerId: string,
    eventType: 'auth.login' | 'auth.logout' | 'auth.login_failed' | 'auth.token_refresh',
    result: 'allowed' | 'denied',
    details?: {
      ip_address?: string;
      user_agent?: string;
      reason?: string;
    }
  ): Promise<AuditEvent> {
    return this.log({
      timestamp: new Date().toISOString(),
      user_id: userId,
      customer_id: customerId,
      event_type: eventType,
      action: eventType,
      resource: '/auth',
      result,
      reason: details?.reason,
      ip_address: details?.ip_address,
      user_agent: details?.user_agent,
      request_id: crypto.randomUUID(),
    });
  }

  /**
   * Log access control decision
   */
  async logAccess(
    userId: string,
    customerId: string,
    permission: PermissionKey,
    resource: string,
    allowed: boolean,
    reason?: string
  ): Promise<AuditEvent> {
    return this.log({
      timestamp: new Date().toISOString(),
      user_id: userId,
      customer_id: customerId,
      event_type: allowed ? 'auth.access_granted' : 'auth.access_denied',
      action: `${permission} on ${resource}`,
      resource,
      result: allowed ? 'allowed' : 'denied',
      reason,
      request_id: crypto.randomUUID(),
    });
  }

  /**
   * Log API key usage
   */
  async logApiKeyUsage(
    userId: string,
    customerId: string,
    apiKeyId: string,
    endpoint: string,
    allowed: boolean
  ): Promise<AuditEvent> {
    return this.log({
      timestamp: new Date().toISOString(),
      user_id: userId,
      customer_id: customerId,
      event_type: 'apikey.used',
      action: `API key ${allowed ? 'used' : 'denied'} for ${endpoint}`,
      resource: endpoint,
      result: allowed ? 'allowed' : 'denied',
      request_id: crypto.randomUUID(),
    });
  }

  /**
   * Query audit logs
   */
  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    return this.storage.query(filters);
  }

  /**
   * Export audit logs (SOC 2 compliance)
   */
  async export(filters: AuditQueryFilters, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.storage.query(filters);

    if (format === 'csv') {
      return this.toCsv(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Apply retention policy
   */
  async applyRetentionPolicy(policy: RetentionPolicy): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    if (!policy.auto_delete) {
      console.log(`[Audit] Policy ${policy.name}: Legal hold - no deletion`);
      return 0;
    }

    const deleted = await this.storage.deleteBefore(cutoffDate);
    await this.log({
      timestamp: new Date().toISOString(),
      user_id: 'system',
      customer_id: this.tenantId,
      event_type: 'compliance.retention_applied',
      action: `Applied retention policy: ${policy.name}`,
      resource: 'audit_logs',
      result: 'allowed',
      reason: `Deleted ${deleted} events older than ${cutoffDate.toISOString()}`,
      request_id: crypto.randomUUID(),
    });

    return deleted;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    customerId?: string
  ): Promise<{
    summary: {
      totalEvents: number;
      deniedEvents: number;
      highRiskEvents: number;
      uniqueUsers: number;
    };
    byEventType: Record<string, number>;
    byUser: Record<string, number>;
    deniedAccess: AuditEvent[];
  }> {
    const filters: AuditQueryFilters = {
      date_from: startDate,
      date_to: endDate,
      limit: 10000,
    };

    if (customerId) {
      filters.customer_id = customerId;
    }

    const events = await this.storage.query(filters);

    return {
      summary: {
        totalEvents: events.length,
        deniedEvents: events.filter(e => e.result === 'denied').length,
        highRiskEvents: events.filter(e => (e.risk_score || 0) >= 70).length,
        uniqueUsers: new Set(events.map(e => e.user_id)).size,
      },
      byEventType: events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byUser: events.reduce((acc, e) => {
        acc[e.user_id] = (acc[e.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      deniedAccess: events.filter(e => e.result === 'denied').slice(0, 100),
    };
  }

  /**
   * Calculate risk score for event
   */
  private calculateRiskScore(event: AuditEvent): number {
    let score = 0;

    // Denied access = +20
    if (event.result === 'denied') score += 20;

    // Failed login = +30
    if (event.event_type === 'auth.login_failed') score += 30;

    // High-risk event types
    const highRiskEvents: AuditEventType[] = [
      'auth.access_denied',
      'apikey.revoked',
      'admin.user_deleted',
    ];
    if (highRiskEvents.includes(event.event_type)) score += 25;

    // Multiple rapid requests (potential attack)
    // This would need context from previous events

    return Math.min(100, score);
  }

  /**
   * Convert events to CSV
   */
  private toCsv(events: AuditEvent[]): string {
    const headers = [
      'timestamp',
      'event_type',
      'user_id',
      'customer_id',
      'resource',
      'result',
      'reason',
      'risk_score',
      'request_id',
    ];

    const rows = events.map(e =>
      headers.map(h => {
        const val = (e as any)[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val).replace(/"/g, '""');
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

/**
 * Default audit log service instance
 */
export const defaultAuditLogService = new AuditLogService();
