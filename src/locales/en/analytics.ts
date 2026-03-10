/**
 * Analytics i18n - English
 * ROIaaS Phase 5 - Revenue & Usage Analytics
 */

export const analytics = {
  // Alert Settings (for RaaSAlertSettings component)
  alert_settings: {
    delete_confirm: 'Are you sure you want to delete this rule?',
    title: 'Alert Rules',
    description: 'Configure alert thresholds and notifications',
    add_rule: 'Add Rule',
    no_rules: 'No alert rules configured',
    no_rules_description: 'Create your first alert rule to get notified of important events',
    disabled: 'Disabled',
    no_description: 'No description',
    threshold: 'Threshold',
    cooldown: 'Cooldown',
    edit: 'Edit rule',
    delete: 'Delete rule',
    edit_rule: 'Edit Rule',
    create_rule: 'Create Rule',
    rule_type: 'Rule Type',
    name: 'Rule Name',
    name_placeholder: 'Enter rule name',
    description: 'Description',
    description_placeholder: 'Enter rule description',
    severity: 'Severity',
    severity_info: 'Info',
    severity_warning: 'Warning',
    severity_critical: 'Critical',
    operator: 'Operator',
    seconds: 'seconds',
    message_template: 'Message Template',
    message_placeholder: 'Enter message template with {{variable}} placeholders',
    message_help: 'Use {{percentage}}, {{featureName}}, {{currentValue}}, {{threshold}} for dynamic values',
    enable_rule: 'Enable rule',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    types: {
      quota_threshold: 'Quota Threshold',
      spending_limit: 'Spending Limit',
      feature_blocked: 'Feature Blocked',
    },
  },
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
    export_dropdown: 'Export Data',
    export_all_csv: 'Export All (CSV)',
    last_updated: 'Last Updated',
    refresh: 'Refresh',
  },

  // Export
  export: {
    top_customers: 'Top Customers',
    tier_distribution: 'Tier Distribution',
    revenue_over_time: 'Revenue Over Time',
    daily_active_licenses: 'Daily Active Licenses',
    full_dashboard: 'Full Dashboard',
    generated_at: 'Generated at',
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

  // Date Range Picker
  dateRange: {
    custom: 'Custom',
    preset_7d: '7 days',
    preset_30d: '30 days',
    preset_90d: '90 days',
    select_range: 'Select date range',
    from: 'From',
    to: 'To',
    apply: 'Apply',
    cancel: 'Cancel',
    format: 'MM/dd/yyyy',
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
    // Alert Badges
    warning: 'Warning',
    critical: 'Critical',
    over_quota: 'Over Quota',
    approaching_limit: 'Approaching Limit',
    suspension_warning: 'Suspension Warning',
    license_expired: 'License Expired',
    payment_past_due: 'Payment Past Due',
    view_details: 'View Details',
    dismiss: 'Dismiss',
  },

  // Premium Tiers
  premium: {
    tier: {
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
    },
    badge: {
      current_tier: 'Current Tier',
    },
    gate: {
      title: 'Premium Feature',
      description: 'Upgrade to unlock this feature',
      upgrade_button: 'Upgrade Now',
    },
    upgrade: {
      title: 'Upgrade Plan',
      description: 'Unlock full analytics potential',
      current_tier: 'Current plan',
      features_title: 'Included Features',
      cta_contact: 'Contact us for custom solutions',
      contact_button: 'Contact',
    },
    features: {
      basic_metrics: 'Basic Metrics (GMV, Active Licenses)',
      advanced_analytics: 'Advanced Analytics (Cohort, Funnel)',
      export_csv: 'Export CSV',
      export_pdf: 'Export PDF',
      real_time_sync: 'Real-time Sync (30s auto-refresh)',
      custom_date_range: 'Custom Date Range Picker',
    },
  },

  // Real-time Analytics Widget (Phase 6.3)
  realtime: {
    title: 'Real-time Analytics',
    live_feed: 'Live Event Feed',
    usage_chart: 'Real-time Usage',
    events_per_minute: 'Events/min',
    no_events: 'No events yet',
    watching: 'Watching',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    last_event: 'Last event',
    ago: 'ago',
    auto_scroll: 'Auto-scroll',
    pause: 'Pause',
    resume: 'Resume',
    clear: 'Clear',
  },

  // Event Types
  event_types: {
    license_validated: 'License Validated',
    license_expired: 'License Expired',
    suspension_created: 'Suspension Created',
    suspension_cleared: 'Suspension Cleared',
    subscription_warning: 'Subscription Warning',
    admin_bypass_used: 'Admin Bypass Used',
    api_request: 'API Request',
    quota_exceeded: 'Quota Exceeded',
  },
}

export default analytics
