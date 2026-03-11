/**
 * Overage Calculator Tests - Phase 7
 */

import { describe, it, expect } from 'vitest'
import { overageCalculator } from '../overage-calculator'

const {
  calculateOverageUnits,
  calculateOverageCost,
  calculatePercentageUsed,
  generateOverageIdempotencyKey,
} = overageCalculator

describe('Overage Calculator', () => {
  describe('calculateOverageUnits', () => {
    it('should return 0 when usage is within quota', () => {
      expect(calculateOverageUnits(500, 1000)).toBe(0)
      expect(calculateOverageUnits(1000, 1000)).toBe(0)
    })

    it('should return positive overage when usage exceeds quota', () => {
      expect(calculateOverageUnits(1500, 1000)).toBe(500)
      expect(calculateOverageUnits(2000, 1000)).toBe(1000)
    })

    it('should handle zero quota', () => {
      expect(calculateOverageUnits(100, 0)).toBe(100)
    })
  })

  describe('calculateOverageCost', () => {
    it('should calculate cost correctly', () => {
      expect(calculateOverageCost(1000, 0.001)).toBe(1.0)
      expect(calculateOverageCost(500, 0.01)).toBe(5.0)
    })

    it('should return 0 for zero overage', () => {
      expect(calculateOverageCost(0, 0.001)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      expect(calculateOverageCost(100, 0.00123)).toBe(0.12)
    })
  })

  describe('calculatePercentageUsed', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentageUsed(500, 1000)).toBe(50)
      expect(calculatePercentageUsed(1000, 1000)).toBe(100)
      expect(calculatePercentageUsed(1500, 1000)).toBe(150)
    })

    it('should handle zero quota', () => {
      expect(calculatePercentageUsed(100, 0)).toBe(100)
    })

    it('should round to 2 decimal places', () => {
      expect(calculatePercentageUsed(333, 1000)).toBe(33.3)
    })
  })

  describe('generateOverageIdempotencyKey', () => {
    it('should generate consistent key', () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000'
      const metricType = 'api_calls'
      const billingPeriod = '2026-03'

      const key1 = generateOverageIdempotencyKey(orgId, metricType, billingPeriod)
      const key2 = generateOverageIdempotencyKey(orgId, metricType, billingPeriod)

      expect(key1).toBe(key2)
      expect(key1).toBe('ovg_123e4567-e89b-12d3-a456-426614174000_api_calls_2026-03')
    })

    it('should generate unique keys for different metrics', () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000'
      const period = '2026-03'

      const key1 = generateOverageIdempotencyKey(orgId, 'api_calls', period)
      const key2 = generateOverageIdempotencyKey(orgId, 'tokens', period)

      expect(key1).not.toBe(key2)
    })
  })
})
