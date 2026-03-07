/**
 * Analytics i18n - English
 * ROIaaS Phase 5 - Revenue & Usage Analytics
 */

export const analytics = {
  // Revenue Metrics
  revenue: {
    title: 'Revenue Analytics',
    gmv: 'GMV',
    gmv_full: 'Gross Merchandise Value',
    mrr: 'MRR',
    mrr_full: 'Monthly Recurring Revenue',
    arr: 'ARR',
    arr_full: 'Annual Recurring Revenue',
    total: 'Total Revenue',
    subscription: 'Subscription',
    usage_based: 'Usage-Based',
    trend: 'Revenue Trend',
  },

  // ROI Metrics
  roi: {
    title: 'ROI Analytics',
    absolute: 'Absolute ROI',
    percentage: 'ROI %',
    margin: 'Margin %',
    costs: 'Total Costs',
    revenue: 'Total Revenue',
    profitable: 'Profitable',
    unprofitable: 'Unprofitable',
    per_license: 'ROI per License',
  },

  // Cost Breakdown
  costs: {
    title: 'Cost Breakdown',
    api_calls: 'API Calls',
    tokens: 'Tokens',
    compute: 'Compute',
    inference: 'Inferences',
    agent_execution: 'Agent Executions',
  },

  // User Metrics
  metrics: {
    dau: 'Daily Active Users',
    mau: 'Monthly Active Users',
    dau_mau_ratio: 'DAU/MAU Ratio',
    conversion: 'Conversion Rate',
    churn: 'Churn Rate',
    retention: 'Retention Rate',
    active_licenses: 'Active Licenses',
    top_consumers: 'Top Consumers',
  },

  // Cohort Analysis
  cohort: {
    title: 'Cohort Analysis',
    size: 'Cohort Size',
    period: 'Period',
    active_users: 'Active Users',
    retained: 'Retained %',
    revenue: 'Cumulative Revenue',
    arpu: 'ARPU',
  },

  // Tier Breakdown
  tiers: {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
    enterprise: 'Enterprise',
    master: 'Master',
  },

  // Dashboard
  dashboard: {
    title: 'Analytics Dashboard',
    engineering_roi: 'Engineering ROI',
    operational_roi: 'Operational ROI',
    export_pdf: 'Export PDF',
    export_csv: 'Export CSV',
    last_updated: 'Last Updated',
    refresh: 'Refresh',
  },

  // Charts
  charts: {
    revenue_trend: 'Revenue Trend',
    usage_trend: 'Usage Trend',
    tier_distribution: 'Tier Distribution',
    roi_distribution: 'ROI Distribution',
    cohort_retention: 'Cohort Retention',
    no_data: 'No data available',
  },

  // Time Periods
  periods: {
    today: 'Today',
    yesterday: 'Yesterday',
    last_7_days: 'Last 7 Days',
    last_30_days: 'Last 30 Days',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    this_year: 'This Year',
  },

  // Actions
  actions: {
    view_details: 'View Details',
    download_report: 'Download Report',
    set_alert: 'Set Alert',
    configure: 'Configure',
  },

  // Alerts
  alerts: {
    high_usage: 'High Usage Alert',
    quota_exceeded: 'Quota Exceeded',
    low_roi: 'Low ROI Warning',
    churn_risk: 'Churn Risk',
  },
}

export default analytics
