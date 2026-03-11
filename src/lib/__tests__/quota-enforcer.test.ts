/**
 * Quota Enforcer Unit Tests - Phase 6
 *
 * Tests for quota enforcement logic including:
 * - Quota checks under/over limits
 * - Enforcement modes (soft/hard/hybrid)
 * - Tenant overrides and grace periods
 * - Unlimited quota handling
 */

import { QuotaEnforcer } from '../quota-enforcer'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabase, createMockQuery } from './mock-supabase'

describe('QuotaEnforcer', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let enforcer: QuotaEnforcer

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    enforcer = new QuotaEnforcer(mockSupabase as unknown as SupabaseClient, {
      orgId: 'test-org-123',
      tenantId: undefined,
      userId: undefined,
      licenseId: undefined,
      enforcementMode: 'hard',
    })
  })

  describe('checkQuota', () => {
    it('allows requests under quota', async () => {
      // Mock usage records query returns 500 usage
      const mockUsageQuery = createMockQuery({
        data: [{ quantity: 500 }],
        error: null,
      })
      // Mock org tier lookup returns 'basic' tier
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null,
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockUsageQuery
        }
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const result = await enforcer.checkQuota('api_calls')

      // Basic tier has 10000 api_calls quota
      // Usage: 500, Quota: 10000, Remaining: 9500
      expect(result.allowed).toBe(true)
      expect(result.currentUsage).toBe(500)
      expect(result.remaining).toBe(9500)
      expect(result.percentageUsed).toBe(5)
      expect(result.isOverLimit).toBe(false)
    })

    it('blocks requests in hard mode when over limit', async () => {
      // Mock: 12000/10000 used (over basic tier limit)
      const mockUsageQuery = createMockQuery({
        data: [{ quantity: 12000 }],
        error: null,
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null,
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockUsageQuery
        }
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const result = await enforcer.checkQuota('api_calls')

      expect(result.allowed).toBe(false)
      expect(result.isOverLimit).toBe(true)
      expect(result.overageUnits).toBe(2000)
      expect(result.percentageUsed).toBe(120)
    })

    it('allows with warning in soft mode when over limit', async () => {
      // Create enforcer with soft mode
      const softEnforcer = new QuotaEnforcer(mockSupabase as unknown as SupabaseClient, {
        orgId: 'test-org-123',
        enforcementMode: 'soft',
      })

      // Mock: 12000/10000 used (over basic tier limit)
      const mockUsageQuery = createMockQuery({
        data: [{ quantity: 12000 }],
        error: null,
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null,
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockUsageQuery
        }
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const result = await softEnforcer.checkQuota('api_calls')

      // Soft mode allows even when over limit
      expect(result.allowed).toBe(true)
      expect(result.isOverLimit).toBe(true)
      expect(result.overageUnits).toBe(2000)
    })

    it('handles unlimited quota (-1)', async () => {
      // Mock unlimited quota
      const mockUsageQuery = createMockQuery({
        data: [{ quantity: 999999 }],
        error: null,
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'master' },
        error: null,
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockUsageQuery
        }
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const result = await enforcer.checkQuota('api_calls')

      // With master tier, quota should be -1 (unlimited)
      expect(result.effectiveQuota).toBe(-1)
      expect(result.remaining).toBe(-1)
    })

    it('returns retryAfter when over limit', async () => {
      // Mock: over limit (12000/10000)
      const mockUsageQuery = createMockQuery({
        data: [{ quantity: 12000 }],
        error: null,
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null,
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockUsageQuery
        }
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const result = await enforcer.checkQuota('api_calls')

      expect(result.isOverLimit).toBe(true)
      expect(result.retryAfter).toBeDefined()
      expect(typeof result.retryAfter).toBe('number')
    })

    it('fails open on database errors', async () => {
      // Mock error on usage query - need to reject on await
      const mockErrorQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
      }
      // Make await reject by implementing then
      Object.defineProperty(mockErrorQuery, 'then', {
        value: function(resolve: any, reject: any) {
          return Promise.reject(new Error('DB connection failed')).then(resolve, reject)
        },
        writable: true,
        configurable: true
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'usage_records') {
          return mockErrorQuery
        }
        // Still need to mock other tables
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return createMockQuery({ data: { plan_slug: 'basic' }, error: null })
      })

      const result = await enforcer.checkQuota('api_calls')

      // Should fail open (allow request)
      expect(result.allowed).toBe(true)
      expect(result.currentUsage).toBe(0)
      // On error, falls back to tier default (basic = 10000), not -1
      expect(result.effectiveQuota).toBe(10000)
    }, 10000)
  })

  describe('getEffectiveQuota', () => {
    it('returns base quota from tier when no overrides', async () => {
      // Mock tier lookup returns 'basic'
      // The code calls: from('user_subscriptions').select().eq().single() for tier lookup
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null,
      })

      // Return different queries for different tables
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'tenant_quota_overrides') {
          return createMockQuery({ data: null, error: null })
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const quota = await enforcer.getEffectiveQuota('api_calls')

      // Basic tier default for api_calls is 10,000
      expect(quota).toBe(10000)
    })

    it('applies tenant quota override', async () => {
      // Mock tenant override
      const mockTenantQuery = createMockQuery({
        data: { quota_limit: 50000 },
        error: null
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'tenant_quota_overrides') {
          return mockTenantQuery
        }
        if (table === 'tenant_grace_periods') {
          return createMockQuery({ data: null, error: null })
        }
        return mockOrgQuery
      })

      const enforcerWithTenant = new QuotaEnforcer(mockSupabase as unknown as SupabaseClient, {
        orgId: 'test-org-123',
        tenantId: 'test-tenant-456',
        enforcementMode: 'hard',
      })

      const quota = await enforcerWithTenant.getEffectiveQuota('api_calls')

      // Should use tenant override (50000) instead of base (10000)
      expect(quota).toBe(50000)
    })

    it('applies grace period boost', async () => {
      // Mock grace period with 20% boost (2000)
      const mockNoTenantOverride = createMockQuery({ data: null, error: null })
      const mockGraceQuery = createMockQuery({
        data: { boost_amount: 2000 },
        error: null
      })
      const mockOrgQuery = createMockQuery({
        data: { plan_slug: 'basic' },
        error: null
      })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'tenant_quota_overrides') {
          return mockNoTenantOverride
        }
        if (table === 'tenant_grace_periods') {
          return mockGraceQuery
        }
        return mockOrgQuery
      })

      const enforcerWithTenant = new QuotaEnforcer(mockSupabase as unknown as SupabaseClient, {
        orgId: 'test-org-123',
        tenantId: 'test-tenant-456',
        enforcementMode: 'hard',
      })

      const quota = await enforcerWithTenant.getEffectiveQuota('api_calls')

      // Base (10000) + Grace boost (2000) = 12000
      expect(quota).toBe(12000)
    })
  })

  describe('setEnforcementMode', () => {
    it('changes enforcement mode dynamically', () => {
      expect(enforcer.getEnforcementMode()).toBe('hard')

      enforcer.setEnforcementMode('soft')
      expect(enforcer.getEnforcementMode()).toBe('soft')

      enforcer.setEnforcementMode('hybrid')
      expect(enforcer.getEnforcementMode()).toBe('hybrid')
    })
  })

  describe('createQuotaExceededResponse', () => {
    it('creates proper 429 response', () => {
      const result = {
        allowed: false,
        currentUsage: 1200,
        effectiveQuota: 1000,
        remaining: 0,
        percentageUsed: 120,
        isOverLimit: true,
        overageUnits: 200,
        enforcementMode: 'hard' as const,
        retryAfter: 3600,
      }

      const response = QuotaEnforcer.createQuotaExceededResponse(result)

      expect(response.status).toBe(429)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Retry-After')).toBe('3600')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1000')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })
  })
})
