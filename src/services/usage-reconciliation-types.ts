/**
 * Usage Reconciliation Service - Type Definitions
 */

export interface ReconciliationConfig {
  orgId: string
  period: string  // YYYY-MM-DD format
  tolerance?: number  // Default: 5% (0.05)
  autoHeal?: boolean  // Default: true
}

export interface ReconciliationResult {
  success: boolean
  orgId: string
  period: string
  gatewayUsage: number
  stripeUsage: number
  polarUsage: number
  discrepancy: number  // Percentage (0.05 = 5%)
  discrepancyAmount: number  // Absolute difference
  autoHealed: boolean
  alertSent: boolean
  error?: string
  reconciledAt: string
}

export interface ReconciliationLog {
  id: string
  orgId: string
  period: string
  gatewayUsage: number
  stripeUsage: number
  polarUsage: number
  discrepancy: number
  autoHealed: boolean
  alertSent: boolean
  status: 'matched' | 'auto_healed' | 'alerted' | 'failed'
  createdAt: string
}

export interface ReconciliationStats {
  totalReconciliations: number
  matchedCount: number
  autoHealedCount: number
  alertedCount: number
  avgDiscrepancy: number
}

export interface AutoHealParams {
  orgId: string
  period: string
  gatewayUsage: number
  billingUsage: number
}

export interface AlertParams {
  orgId: string
  gatewayUsage: number
  billingUsage: number
  discrepancy: number
}

export interface LogParams {
  orgId: string
  period: string
  gatewayUsage: number
  stripeUsage: number
  polarUsage: number
  discrepancy: number
  autoHealed: boolean
  alertSent: boolean
  status: 'matched' | 'auto_healed' | 'alerted'
}
