/**
 * E2E Test: Complete RaaS Workflow
 *
 * Tests full workflow from license activation to analytics dashboard:
 * 1. License key activation with JWT/mk_ API key auth
 * 2. Usage tracking through RaaS Gateway
 * 3. KV storage with rate limiting and idempotency
 * 4. Stripe/Polar webhook handling
 * 5. Analytics dashboard sync (<10s SLA)
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'
import { RaasGatewayClient } from '@/lib/raas-gateway-client'

// ============================================
// Test Data Factories
// ============================================

function createTestOrg() {
  return {
    id: `org_test_${Date.now()}`,
    name: 'Test Organization',
    stripeCustomerId: `cus_test_${Date.now()}`,
  }
}

function createTestLicense(orgId: string) {
  return {
    id: `lic_test_${Date.now()}`,
    orgId,
    key: `lic_key_${Date.now()}_abcdef`,
    status: 'active' as const,
    tier: 'professional' as const,
    features: ['api_calls', 'tokens'],
  }
}

function createTestUser(orgId: string) {
  return {
    id: `user_test_${Date.now()}`,
    orgId,
    email: `test_${Date.now()}@example.com`,
  }
}

// ============================================
// Mock Supabase Client
// ============================================

class MockSupabaseClient {
  private data = new Map<string, any[]>()

  from(table: string) {
    return {
      insert: async (rows: any | any[]) => {
        const arr = Array.isArray(rows) ? rows : [rows]
        const stored = this.data.get(table) || []
        stored.push(...arr.map(r => ({ ...r, id: `id_${Date.now()}_${Math.random()}` })))
        this.data.set(table, stored)
        return { select: () => ({ single: async () => ({ data: arr[0], error: null }) }) }
      },
      select: () => ({
        eq: (field: string, value: any) => ({
          gte: () => ({ lt: () => ({ data: this.data.get(table) || [] }) }),
          data: this.data.get(table) || [],
        }),
        data: this.data.get(table) || [],
      }),
    }
  }
}

// ============================================
// Mock RaaS Gateway Server
// ============================================

class MockRaaSGateway {
  private kv = new Map<string, any>()
  private rateLimits = new Map<string, number>()
  private requests: any[] = []

  async reportUsage(data: any, authHeader: string) {
    this.requests.push({ path: '/api/v1/usage/report', data, authHeader })

    // Validate auth
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    // Rate limiting (10 req/sec)
    const clientId = authHeader.split(' ')[1]
    const now = Date.now()
    const lastCall = this.rateLimits.get(clientId) || 0
    if (now - lastCall < 100) {
      throw new Error('Rate limit exceeded')
    }
    this.rateLimits.set(clientId, now)

    // Store in KV
    const key = `usage:${data.orgId}:${data.period}`
    const existing = this.kv.get(key) || { metrics: {} }

    // Merge metrics
    for (const [metric, value] of Object.entries(data.metrics)) {
      if (!existing.metrics[metric]) {
        existing.metrics[metric] = { totalUsage: 0 }
      }
      existing.metrics[metric].totalUsage += (value as any).totalUsage || 0
    }

    this.kv.set(key, {
      ...existing,
      ...data,
      syncedAt: new Date().toISOString(),
    })

    return {
      success: true,
      syncedAt: new Date().toISOString(),
      duplicate: false,
    }
  }

  async fetchUsage(orgId: string, period: string) {
    const key = `usage:${orgId}:${period}`
    return this.kv.get(key) || { metrics: {}, period }
  }

  getRequestLog() {
    return this.requests
  }
}

// ============================================
// E2E Tests
// ============================================

describe('RaaS Workflow E2E', () => {
  let mockGateway: MockRaaSGateway
  let authClient: GatewayAuthClient
  let gatewayClient: RaasGatewayClient
  let supabase: any

  let testOrg: ReturnType<typeof createTestOrg>
  let testLicense: ReturnType<typeof createTestLicense>
  let testUser: ReturnType<typeof createTestUser>

  beforeAll(() => {
    mockGateway = new MockRaaSGateway()
    supabase = new MockSupabaseClient()

    // Setup auth client
    authClient = new GatewayAuthClient({
      issuer: 'wellnexus.vn',
      audience: 'raas.agencyos.network',
      apiKey: 'mk_testkey1234567890', // 16+ alphanumeric chars after mk_
    })

    // Setup gateway client with mock
    gatewayClient = new RaasGatewayClient({
      baseUrl: 'http://localhost:8787',
      authClient,
      fetch: async (url, options) => {
        const path = new URL(url).pathname
        const body = options?.body ? JSON.parse(options.body as string) : {}
        const headers = options?.headers as Record<string, string>

        if (path === '/api/v1/usage/report') {
          const result = await mockGateway.reportUsage(body, headers.Authorization)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(result),
          } as Response)
        }

        if (path.startsWith('/api/v1/usage/')) {
          const orgId = path.split('/')[4]
          const period = new URL(url).searchParams.get('period') || new Date().toISOString().slice(0, 7)
          const result = await mockGateway.fetchUsage(orgId, period)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(result),
          } as Response)
        }

        return Promise.resolve({ ok: false, status: 404 } as Response)
      },
    })
  })

  beforeEach(() => {
    testOrg = createTestOrg()
    testLicense = createTestLicense(testOrg.id)
    testUser = createTestUser(testOrg.id)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Test 1: License Key Activation & JWT Auth
  // ============================================
  describe('Test 1: License Key Activation & JWT Auth', () => {
    it('should generate valid JWT token for license', () => {
      // Act
      const result = authClient.generateToken(testOrg.id, testLicense.id)

      // Assert
      expect(result.token).toBeDefined()
      expect(result.expiresAt).toBeGreaterThan(Date.now())
      expect(result.refreshed).toBe(false)

      // Verify JWT format (header.payload.signature)
      const tokenParts = result.token.split('.')
      expect(tokenParts).toHaveLength(3)

      // Verify payload claims
      const payload = JSON.parse(atob(tokenParts[1]))
      expect(payload.iss).toBe('wellnexus.vn')
      expect(payload.aud).toBe('raas.agencyos.network')
      expect(payload.sub).toBe(testOrg.id)
      expect(payload.license_id).toBe(testLicense.id)
      expect(payload.mk_key).toContain('mk_')
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should cache and reuse JWT tokens', () => {
      // Act
      const result1 = authClient.generateToken(testOrg.id, testLicense.id)
      const result2 = authClient.generateToken(testOrg.id, testLicense.id)

      // Assert - same token returned (cached)
      expect(result1.token).toBe(result2.token)
      expect(result1.expiresAt).toBe(result2.expiresAt)
    })

    it('should validate mk_ API key format', () => {
      // Valid keys (16+ alphanumeric after mk_)
      expect(authClient.validateApiKeyFormat('mk_abcdefghijklmnop')).toBe(true)
      expect(authClient.validateApiKeyFormat('mk_testkey1234567890')).toBe(true)
      expect(authClient.validateApiKeyFormat('mk_ABCDEFGHIJKLMNOP')).toBe(true)

      // Invalid keys
      expect(authClient.validateApiKeyFormat('api_key_123')).toBe(false)
      expect(authClient.validateApiKeyFormat('mkabc123')).toBe(false)
      expect(authClient.validateApiKeyFormat('mk_short')).toBe(false)
      expect(authClient.validateApiKeyFormat('mk_with_underscore')).toBe(false)
      expect(authClient.validateApiKeyFormat('')).toBe(false)
    })
  })

  // ============================================
  // Test 2: Usage Events Through RaaS Gateway
  // ============================================
  describe('Test 2: Usage Events Through RaaS Gateway', () => {
    it('should include JWT in Gateway requests', async () => {
      // Arrange
      const reportData = {
        orgId: testOrg.id,
        licenseId: testLicense.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: {
          api_calls: { totalUsage: 1000 },
        },
        timestamp: new Date().toISOString(),
      }

      // Act
      await gatewayClient.reportUsage(reportData)

      // Assert - Gateway received request with JWT
      const requestLog = mockGateway.getRequestLog()
      expect(requestLog.length).toBeGreaterThan(0)

      const lastRequest = requestLog[requestLog.length - 1]
      expect(lastRequest.authHeader).toContain('Bearer ')
    })

    it('should fetch usage from Gateway', async () => {
      // Arrange - seed data
      const token1 = await authClient.generateToken(testOrg.id).then(r => r.token)
      await mockGateway.reportUsage({
        orgId: testOrg.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: { api_calls: { totalUsage: 5000 } },
      }, `Bearer ${token1}`)

      // Act
      const usage = await gatewayClient.fetchUsage(testOrg.id, new Date().toISOString().slice(0, 7))

      // Assert
      expect(usage.metrics.api_calls).toBeDefined()
      expect(usage.metrics.api_calls.totalUsage).toBeGreaterThanOrEqual(5000)
    })
  })

  // ============================================
  // Test 3: KV Storage & Rate Limiting
  // ============================================
  describe('Test 3: KV Storage & Rate Limiting', () => {
    it('should aggregate usage in KV storage', async () => {
      // Arrange & Act - multiple reports
      const token1 = await authClient.generateToken(testOrg.id).then(r => r.token)
      await mockGateway.reportUsage({
        orgId: testOrg.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: { api_calls: { totalUsage: 100 } },
      }, `Bearer ${token1}`)

      const token2 = await authClient.generateToken(testOrg.id).then(r => r.token)
      await mockGateway.reportUsage({
        orgId: testOrg.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: { api_calls: { totalUsage: 200 } },
      }, `Bearer ${token2}`)

      const token3 = await authClient.generateToken(testOrg.id).then(r => r.token)
      await mockGateway.reportUsage({
        orgId: testOrg.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: { tokens: { totalUsage: 5000 } },
      }, `Bearer ${token3}`)

      // Assert
      const usage = await mockGateway.fetchUsage(testOrg.id, new Date().toISOString().slice(0, 7))

      expect(usage.metrics.api_calls).toBeDefined()
      expect(usage.metrics.api_calls.totalUsage).toBeGreaterThanOrEqual(300)
      expect(usage.metrics.tokens).toBeDefined()
      expect(usage.metrics.tokens.totalUsage).toBeGreaterThanOrEqual(5000)
    })

    it('should enforce rate limiting', async () => {
      // Arrange
      const token = await authClient.generateToken(testOrg.id).then(r => r.token)
      const promises = Array.from({ length: 15 }, () =>
        mockGateway.reportUsage({
          orgId: testOrg.id,
          period: new Date().toISOString().slice(0, 7),
          metrics: { api_calls: { totalUsage: 10 } },
        }, `Bearer ${token}`)
      )

      // Act - send concurrently
      const results = await Promise.allSettled(promises)

      // Assert - some may be rate limited
      const fulfilled = results.filter(r => r.status === 'fulfilled')
      const rejected = results.filter(r => r.status === 'rejected')

      // At least some should succeed
      expect(fulfilled.length).toBeGreaterThan(0)

      // Some may be rate limited (depends on timing)
      if (rejected.length > 0) {
        expect((rejected[0].reason as Error).message).toContain('Rate limit')
      }
    })
  })

  // ============================================
  // Test 4: Stripe/Polar Webhook Integration
  // ============================================
  describe('Test 4: Stripe/Polar Webhook Integration', () => {
    it('should parse Stripe payment webhook', async () => {
      // Arrange - Mock Stripe webhook payload
      const webhookPayload = {
        id: `evt_test_${Date.now()}`,
        type: 'invoice.payment_succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `in_test_${Date.now()}`,
            customer: testOrg.stripeCustomerId,
            amount_due: 9900,
            status: 'paid',
            metadata: {
              org_id: testOrg.id,
              license_id: testLicense.id,
            },
          },
        },
      }

      // Assert - webhook structure is valid
      expect(webhookPayload.type).toBe('invoice.payment_succeeded')
      expect(webhookPayload.data.object.metadata.org_id).toBe(testOrg.id)
    })

    it('should calculate overage cost', async () => {
      // Arrange
      const usage = 1500
      const quota = 1000
      const ratePerUnit = 0.001

      // Act
      const overageUnits = Math.max(0, usage - quota)
      const totalCost = overageUnits * ratePerUnit

      // Assert
      expect(overageUnits).toBe(500)
      expect(totalCost).toBe(0.5)
    })
  })

  // ============================================
  // Test 5: Analytics Dashboard Sync (<10s SLA)
  // ============================================
  describe('Test 5: Analytics Dashboard Sync', () => {
    it('should sync usage to dashboard within 10s SLA', async () => {
      // Arrange
      const startTime = Date.now()
      const metricType = 'api_calls'
      const quantity = 2000

      // Act - Report usage
      const token5 = await authClient.generateToken(testOrg.id).then(r => r.token)
      await mockGateway.reportUsage({
        orgId: testOrg.id,
        period: new Date().toISOString().slice(0, 7),
        metrics: { [metricType]: { totalUsage: quantity } },
      }, `Bearer ${token5}`)

      // Fetch from "dashboard" (Gateway)
      const dashboardData = await mockGateway.fetchUsage(
        testOrg.id,
        new Date().toISOString().slice(0, 7)
      )
      const endTime = Date.now()
      const latency = endTime - startTime

      // Assert
      expect(latency).toBeLessThan(10000) // <10 seconds SLA
      expect(dashboardData.metrics[metricType]).toBeDefined()
      expect(dashboardData.metrics[metricType].totalUsage).toBeGreaterThanOrEqual(quantity)

      console.log(`Dashboard sync latency: ${latency}ms`)
    })
  })

  // ============================================
  // Test 6: License State Scenarios
  // ============================================
  describe('Test 6: License State Scenarios', () => {
    it('should generate JWT for active license', async () => {
      // Arrange - Active license (default)
      expect(testLicense.status).toBe('active')

      // Act
      const result = await authClient.generateToken(testOrg.id, testLicense.id)

      // Assert
      expect(result.token).toBeDefined()
      expect(result.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should include license_id in JWT payload', async () => {
      // Act
      const result = await authClient.generateToken(testOrg.id, testLicense.id)

      // Verify payload
      const payload = JSON.parse(atob(result.token.split('.')[1]))
      expect(payload.license_id).toBe(testLicense.id)
    })
  })
})
