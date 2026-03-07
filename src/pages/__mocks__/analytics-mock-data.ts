/**
 * Mock data for Analytics Dashboard Page
 * Replace with real API calls in production
 */

export const MOCK_REVENUE_DATA = {
  currentSnapshot: {
    id: '1',
    snapshot_date: '2026-03-07',
    gmv: {
      total: 150000000,
      subscription: 120000000,
      usage_based: 30000000,
    },
    mrr: {
      total: 150000000,
      new: 20000000,
      expansion: 10000000,
      contraction: 5000000,
      churn: 3000000,
    },
    arr: {
      total: 1800000000,
    },
    customers: {
      total: 250,
      new: 25,
      churned: 5,
    },
    tier_breakdown: {
      free: 100,
      basic: 80,
      premium: 50,
      enterprise: 15,
      master: 5,
    },
  },
  previousSnapshot: null,
  trend: {
    gmv: 15.5,
    mrr: 12.3,
    arr: 18.7,
    customers: 8.5,
  },
}

export const MOCK_USER_METRICS = {
  dau: 1250,
  mau: 4500,
  dau_mau_ratio: 0.28,
  conversion_rate: 10.5,
  churn_rate: 2.1,
  retention_rate: 72.5,
}

export const MOCK_TOP_CONSUMERS = [
  {
    license_id: 'lic_123',
    user_id: 'user_456',
    feature: 'api_call',
    total_usage: 50000,
    total_events: 1200,
    last_activity: '2026-03-07T10:30:00Z',
    avg_daily_usage: 1800,
  },
  {
    license_id: 'lic_124',
    user_id: 'user_789',
    feature: 'agent_execution',
    total_usage: 35000,
    total_events: 850,
    last_activity: '2026-03-07T09:15:00Z',
    avg_daily_usage: 1200,
  },
  {
    license_id: 'lic_125',
    user_id: 'user_012',
    feature: 'model_inference',
    total_usage: 28000,
    total_events: 650,
    last_activity: '2026-03-07T11:00:00Z',
    avg_daily_usage: 950,
  },
]
