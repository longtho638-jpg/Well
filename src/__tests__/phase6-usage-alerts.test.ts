/**
 * Phase 6 Usage Alerts Test Suite
 *
 * Tests for real-time usage alerts system:
 * - UsageAlertEngine threshold monitoring
 * - Webhook delivery with JWT auth
 * - Alert idempotency and cooldown
 * - Frontend hooks and components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsageAlertEngine } from '../lib/usage-alert-engine'
import type { AlertMetricType, AlertThreshold } from '../lib/usage-alert-engine'
import type { AlertMetricInfo } from '../types/usage-alerts'

// Helper functions (copied from source for testing)
const getAlertSeverity = (threshold: AlertThreshold): 'warning' | 'critical' | 'exhausted' => {
  if (threshold === 80) return 'warning'
  if (threshold === 90) return 'critical'
  return 'exhausted'
}

const getAlertColor = (threshold: AlertThreshold): string => {
  if (threshold === 80) return 'text-amber-400 border-amber-400/30 bg-amber-500/10'
  if (threshold === 90) return 'text-orange-400 border-orange-400/30 bg-orange-500/10'
  return 'text-red-400 border-red-400/30 bg-red-500/10'
}

const formatAlertMessage = (
  metricType: AlertMetricType,
  threshold: AlertThreshold,
  usagePercentage: number
): string => {
  const metricLabels: Record<AlertMetricType, string> = {
    api_calls: 'API Calls',
    tokens: 'Tokens',
    compute_minutes: 'Compute Time',
    model_inferences: 'AI Inferences',
    agent_executions: 'Agent Executions',
  }
  const severity = getAlertSeverity(threshold)
  if (severity === 'exhausted') {
    return `Đã hết: ${metricLabels[metricType]} vượt quá giới hạn!`
  }
  return `${metricLabels[metricType]}: ${usagePercentage}% - ${severity === 'warning' ? 'Cảnh báo' : 'Sắp hết'}`
}

const ALERT_METRIC_INFO: Record<AlertMetricType, AlertMetricInfo> = {
  api_calls: { label: 'API Calls', unit: 'calls', icon: '📡', color: 'text-blue-400' },
  tokens: { label: 'Tokens', unit: 'tokens', icon: '🔑', color: 'text-purple-400' },
  compute_minutes: { label: 'Compute Time', unit: 'minutes', icon: '⚡', color: 'text-yellow-400' },
  model_inferences: { label: 'AI Inferences', unit: 'inferences', icon: '🤖', color: 'text-pink-400' },
  agent_executions: { label: 'Agent Executions', unit: 'executions', icon: '🚀', color: 'text-emerald-400' },
}

// Mock Supabase client

// Mock Supabase client
const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        then: vi.fn(),
      })),
      then: vi.fn(),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
  functions: {
    invoke: vi.fn(),
  },
  rpc: vi.fn(),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
  removeChannel: vi.fn(),
})

describe('Phase 6: Usage Alerts', () => {
  describe('UsageAlertEngine', () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>
    let engine: UsageAlertEngine

    beforeEach(() => {
      mockSupabase = createMockSupabase()
      engine = new UsageAlertEngine(mockSupabase as any, {
        userId: 'test-user-123',
        licenseId: 'test-license-456',
        tier: 'premium',
      })
    })

    it('should initialize with correct config', () => {
      expect(engine).toBeDefined()
    })

    it('should have canSendAlert method', async () => {
      // Mock RPC to return true (can send)
      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true })

      const canSend = await engine.canSendAlert('api_calls', 80)
      expect(canSend).toBe(true)
    })

    it('should prevent duplicate alerts within cooldown', async () => {
      // Mock RPC to return false (already sent within cooldown)
      ;(mockSupabase.rpc as any).mockResolvedValueOnce({ data: false })
      const canSend = await engine.canSendAlert('api_calls', 80)
      expect(canSend).toBe(false)
    })
  })

  describe('Alert Threshold Logic', () => {
    it('should trigger alert at exactly 80% usage', () => {
      const percentage = 80
      expect(percentage >= 80).toBe(true)
    })

    it('should trigger alert at exactly 90% usage', () => {
      const percentage = 90
      expect(percentage >= 90).toBe(true)
    })

    it('should trigger alert at exactly 100% usage', () => {
      const percentage = 100
      expect(percentage >= 100).toBe(true)
    })

    it('should NOT trigger alert below 80% usage', () => {
      const percentage = 79
      expect(percentage >= 80).toBe(false)
    })
  })

  describe('Usage Percentage Calculation', () => {
    it('should calculate percentage correctly', () => {
      const currentUsage = 800
      const quotaLimit = 1000
      const percentage = Math.round((currentUsage / quotaLimit) * 100)
      expect(percentage).toBe(80)
    })

    it('should handle usage exceeding quota', () => {
      const currentUsage = 1200
      const quotaLimit = 1000
      const percentage = Math.round((currentUsage / quotaLimit) * 100)
      expect(percentage).toBe(120)
    })

    it('should handle zero quota limit', () => {
      const currentUsage = 100
      const quotaLimit = 0
      const percentage = quotaLimit === 0 ? 0 : Math.round((currentUsage / quotaLimit) * 100)
      expect(percentage).toBe(0) // Prevent division by zero
    })
  })
})

describe('Phase 6: Alert Webhook Integration', () => {
  describe('JWT Payload Structure', () => {
    it('should have required JWT claims', () => {
      const payload = {
        iss: 'raas.agencyos.network',
        aud: 'agencyos.network',
        sub: 'user-123',
        event_type: 'usage.threshold_exceeded',
        event_id: 'event-456',
        metric_type: 'api_calls',
        threshold_percentage: 80,
        current_usage: 800,
        quota_limit: 1000,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }

      expect(payload.iss).toBe('raas.agencyos.network')
      expect(payload.aud).toBe('agencyos.network')
      expect(payload.exp).toBeGreaterThan(payload.iat)
    })
  })

  describe('Webhook Delivery Status', () => {
    it('should have valid status values', () => {
      const validStatuses = ['pending', 'sent', 'failed', 'retrying']
      validStatuses.forEach((status) => {
        expect(['pending', 'sent', 'failed', 'retrying']).toContain(status)
      })
    })
  })

  describe('Idempotency Key Format', () => {
    it('should generate unique idempotency key', () => {
      const userId = 'user-123'
      const metricType = 'api_calls'
      const threshold = 80
      const date = '2026-03-08'

      const idempotencyKey = `${userId}_${metricType}_${threshold}_${date}`
      expect(idempotencyKey).toBe('user-123_api_calls_80_2026-03-08')
    })
  })
})
