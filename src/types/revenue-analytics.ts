/**
 * Revenue Analytics Types - ROIaaS Phase 5
 *
 * Types for revenue tracking, ROI calculations, and cohort analysis
 */

/**
 * Revenue Snapshot - Daily GMV/MRR/ARR metrics
 */
export interface RevenueSnapshot {
  id: string
  snapshot_date: string
  gmv: {
    total: number
    subscription: number
    usage_based: number
  }
  mrr: {
    total: number
    new: number
    expansion: number
    contraction: number
    churn: number
  }
  arr: {
    total: number
  }
  customers: {
    total: number
    new: number
    churned: number
  }
  tier_breakdown: Record<string, number>
}

/**
 * ROI Calculation - Per license key profitability
 */
export interface ROICalculation {
  id: string
  license_id: string
  user_id: string
  calculation_date: string
  revenue: {
    subscription: number
    usage_based: number
    total: number
  }
  costs: {
    api_calls: number
    tokens: number
    compute: number
    total: number
  }
  metrics: {
    roi_absolute: number
    roi_percentage: number
    margin_percentage: number
  }
  usage: {
    api_calls: number
    tokens: number
    agent_executions: number
  }
}

/**
 * Cohort Metric - User retention by cohort
 */
export interface CohortMetric {
  id: string
  cohort_month: string
  cohort_size: number
  period_day: number
  active_users: number
  retained_percentage: number
  revenue_cumulative: number
  arpu: number
}

/**
 * Revenue Dashboard Data
 */
export interface RevenueDashboardData {
  currentSnapshot: RevenueSnapshot
  previousSnapshot: RevenueSnapshot | null
  trend: {
    gmv: number  // percentage change
    mrr: number
    arr: number
    customers: number
  }
}

/**
 * User Metrics
 */
export interface UserMetrics {
  dau: number  // Daily Active Users
  mau: number  // Monthly Active Users
  dau_mau_ratio: number
  conversion_rate: number
  churn_rate: number
  retention_rate: number
}

/**
 * Cost configuration for ROI calculations
 */
export interface CostConfig {
  cost_per_1k_api_calls: number
  cost_per_1k_tokens: number
  cost_per_minute_compute: number
  cost_per_inference: number
  cost_per_agent_execution: number
}

/**
 * Default cost configuration (USD)
 */
export const DEFAULT_COST_CONFIG: CostConfig = {
  cost_per_1k_api_calls: 0.001,      // $0.001 per 1K calls
  cost_per_1k_tokens: 0.002,         // $0.002 per 1K tokens
  cost_per_minute_compute: 0.05,     // $0.05 per minute
  cost_per_inference: 0.01,          // $0.01 per inference
  cost_per_agent_execution: 0.10,    // $0.10 per execution
}

/**
 * License tier pricing (VND)
 */
export const TIER_PRICING: Record<string, number> = {
  free: 0,           // ₫0/month
  basic: 10000,      // ₫10,000/month
  premium: 50000,    // ₫50,000/month
  enterprise: 200000, // ₫200,000/month
  master: 1000000,   // ₫1,000,000/month
}

/**
 * ROI Summary for Dashboard
 */
export interface ROISummary {
  total_revenue: number
  total_costs: number
  total_roi: number
  avg_margin: number
  profitable_licenses: number
  unprofitable_licenses: number
}

/**
 * Cohort Analysis Result
 */
export interface CohortAnalysis {
  cohort_month: string
  cohort_size: number
  periods: Array<{
    day: number
    active_users: number
    retained_percentage: number
    revenue: number
    arpu: number
  }>
}
