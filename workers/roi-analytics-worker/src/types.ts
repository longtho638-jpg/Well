/**
 * ROI Analytics Worker - Types
 */

export interface StripeData {
  orgs: string[]
  subscriptionRevenue: Record<string, number>
  usageRevenue: Record<string, number>
  mrr: Record<string, number>
}

export interface PolarData {
  orgs: string[]
  checkoutRevenue: Record<string, number>
  overageRevenue: Record<string, number>
  activeSubscriptions: Record<string, number>
}

export interface typeROIDigest {
  orgId: string
  date: string
  totalCost: number
  totalValue: number
  roiPercentage: number
  stripe: {
    subscription: number
    usage: number
    mrr: number
  }
  polar: {
    checkout: number
    overage: number
    active: number
  }
  tier: string
  status: 'positive' | 'negative' | 'neutral'
}

export interface WebhookPayload {
  digests: typeROIDigest[]
  timestamp: string
  version: string
}

export interface ROIInput {
  orgId: string
  stripeData: StripeData
  polarData: PolarData
  date: string
}
