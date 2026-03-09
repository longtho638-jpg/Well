/**
 * Test Fixtures for RaaS E2E Tests
 *
 * Provides reusable test data factories and setup/teardown utilities
 */

import { v4 as uuidv4 } from 'uuid'

// ============================================
// Data Factories
// ============================================

export function createTestOrg(overrides?: Partial<TestOrg>) {
  const base: TestOrg = {
    id: `org_${uuidv4()}`,
    name: 'Test Organization',
    email: `test-${uuidv4()}@example.com`,
    stripeCustomerId: `cus_${uuidv4()}`,
    polarCustomerId: `polar_${uuidv4()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

export function createTestLicense(orgId: string, overrides?: Partial<TestLicense>) {
  const base: TestLicense = {
    id: `lic_${uuidv4()}`,
    orgId,
    key: `lic_key_${uuidv4()}_abcdef`,
    status: 'active',
    tier: 'professional',
    features: ['api_calls', 'tokens', 'storage'],
    seats: 10,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }
  return { ...base, ...overrides }
}

export function createTestUser(orgId: string, overrides?: Partial<TestUser>) {
  const base: TestUser = {
    id: `user_${uuidv4()}`,
    orgId,
    email: `user-${uuidv4()}@example.com`,
    role: 'admin',
    name: 'Test User',
    createdAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

export function createTestSubscription(
  orgId: string,
  licenseId: string,
  overrides?: Partial<TestSubscription>
) {
  const base: TestSubscription = {
    id: `sub_${uuidv4()}`,
    orgId,
    licenseId,
    stripeSubscriptionId: `sub_stripe_${uuidv4()}`,
    polarSubscriptionId: `polar_sub_${uuidv4()}`,
    status: 'active',
    plan: 'professional',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

export function createTestUsageRecord(
  orgId: string,
  metricType: string,
  quantity: number,
  overrides?: Partial<TestUsageRecord>
) {
  const base: TestUsageRecord = {
    id: `usage_${uuidv4()}`,
    orgId,
    metricType,
    quantity,
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    timestamp: new Date().toISOString(),
    idempotencyKey: `idemp_${uuidv4()}`,
  }
  return { ...base, ...overrides }
}

export function createTestAlert(
  orgId: string,
  metricType: string,
  thresholdPercentage: number,
  overrides?: Partial<TestAlert>
) {
  const base: TestAlert = {
    id: `alert_${uuidv4()}`,
    orgId,
    metricType,
    thresholdPercentage,
    currentUsage: 0,
    quotaLimit: 1000,
    channel: 'email',
    status: 'pending',
    sentAt: null,
    createdAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

export function createTestInvoice(overrides?: Partial<TestInvoice>) {
  const base: TestInvoice = {
    id: `in_${uuidv4()}`,
    stripeInvoiceId: `in_stripe_${uuidv4()}`,
    orgId: `org_${uuidv4()}`,
    amountDue: 9900,
    amountPaid: 0,
    status: 'open',
    currency: 'usd',
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  return { ...base, ...overrides }
}

export function createWebhookPayload(
  eventType: string,
  data: any,
  overrides?: Partial<TestWebhookPayload>
) {
  const base: TestWebhookPayload = {
    id: `evt_${uuidv4()}`,
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data,
    api_version: '2023-10-16',
  }
  return { ...base, ...overrides }
}

export function createStripeSignature(payload: string, secret: string): string {
  // Simplified signature generation for testing
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  // In real implementation, use HMAC-SHA256
  return `t=${timestamp},v1=mock_signature_${Buffer.from(signedPayload).toString('hex')}`
}

// ============================================
// Test Helpers
// ============================================

export async function setupTestDatabase() {
  // Initialize test database connection
  // This would connect to a test Supabase instance
  console.log('Setting up test database...')
}

export async function cleanupTestDatabase(orgId?: string) {
  // Cleanup test data
  if (orgId) {
    console.log(`Cleaning up test data for org: ${orgId}`)
  } else {
    console.log('Cleaning up all test data...')
  }
}

export async function seedTestData() {
  // Seed initial test data
  console.log('Seeding test data...')
}

// ============================================
// Mock Servers
// ============================================

export class MockStripeServer {
  private invoices = new Map<string, any>()
  private subscriptions = new Map<string, any>()

  async createInvoice(data: any) {
    const invoice = createTestInvoice({ ...data })
    this.invoices.set(invoice.id, invoice)
    return invoice
  }

  async getInvoice(invoiceId: string) {
    return this.invoices.get(invoiceId)
  }

  async updateInvoice(invoiceId: string, data: any) {
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    const updated = { ...invoice, ...data }
    this.invoices.set(invoiceId, updated)
    return updated
  }
}

export class MockPolarServer {
  private subscriptions = new Map<string, any>()
  private usage = new Map<string, any>()

  async createSubscription(data: any) {
    const sub = {
      id: `polar_sub_${uuidv4()}`,
      ...data,
      status: 'active',
    }
    this.subscriptions.set(sub.id, sub)
    return sub
  }

  async reportUsage(data: any) {
    const key = `${data.orgId}:${data.period}`
    this.usage.set(key, {
      ...data,
      reportedAt: new Date().toISOString(),
    })
    return { success: true }
  }

  async getUsage(orgId: string, period: string) {
    return this.usage.get(`${orgId}:${period}`)
  }
}

export class MockRaaSGatewayServer {
  private kv = new Map<string, any>()
  private rateLimits = new Map<string, number>()
  private requests: Request[] = []

  async handleRequest(request: Request & { headers: { get: (name: string) => string | null } }) {
    this.requests.push(request)
    const authHeader = request.headers?.get?.('Authorization') || request.headers?.['Authorization']
    const path = new URL(request.url).pathname

    // Validate JWT
    if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }

    // Rate limiting (10 req/sec)
    const clientId = String(authHeader).split(' ')[1]
    const now = Date.now()
    const lastCall = this.rateLimits.get(clientId) || 0
    if (now - lastCall < 100) {
      return { status: 429, body: { error: 'Rate limit exceeded' } }
    }
    this.rateLimits.set(clientId, now)

    // Route handling
    if (path === '/api/v1/usage/report') {
      const body = request.body || request.json?.()
      const key = `usage:${body.orgId}:${body.period}`
      this.kv.set(key, { ...body, syncedAt: new Date().toISOString() })
      return {
        status: 200,
        body: {
          success: true,
          syncedAt: new Date().toISOString(),
          idempotencyKey: body.idempotencyKey
        }
      }
    }

    if (path.startsWith('/api/v1/usage/')) {
      const orgId = path.split('/')[4]
      const period = new URL(request.url).searchParams.get('period') ||
        new Date().toISOString().slice(0, 7)
      const key = `usage:${orgId}:${period}`
      const data = this.kv.get(key) || { metrics: {}, period }
      return { status: 200, body: data }
    }

    return { status: 404, body: { error: 'Not Found' } }
  }

  getUsage(orgId: string, period: string) {
    return this.kv.get(`usage:${orgId}:${period}`)
  }

  getRequestLog() {
    return this.requests
  }

  clearRequestLog() {
    this.requests = []
  }
}

// ============================================
// Type Definitions
// ============================================

export interface TestOrg {
  id: string
  name: string
  email: string
  stripeCustomerId: string
  polarCustomerId: string
  createdAt: string
  updatedAt: string
}

export interface TestLicense {
  id: string
  orgId: string
  key: string
  status: string
  tier: string
  features: string[]
  seats: number
  createdAt: string
  expiresAt: string
}

export interface TestUser {
  id: string
  orgId: string
  email: string
  role: string
  name: string
  createdAt: string
}

export interface TestSubscription {
  id: string
  orgId: string
  licenseId: string
  stripeSubscriptionId: string
  polarSubscriptionId: string
  status: string
  plan: string
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
}

export interface TestUsageRecord {
  id: string
  orgId: string
  metricType: string
  quantity: number
  period: string
  timestamp: string
  idempotencyKey: string
}

export interface TestAlert {
  id: string
  orgId: string
  metricType: string
  thresholdPercentage: number
  currentUsage: number
  quotaLimit: number
  channel: string
  status: string
  sentAt: string | null
  createdAt: string
}

export interface TestInvoice {
  id: string
  stripeInvoiceId: string
  orgId: string
  amountDue: number
  amountPaid: number
  status: string
  currency: string
  periodStart: string
  periodEnd: string
  createdAt: string
}

export interface TestWebhookPayload {
  id: string
  type: string
  created: number
  data: any
  api_version: string
}
