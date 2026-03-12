/**
 * Alert Configuration for Billing & Usage Monitoring
 */

export interface AlertMetricConfig {
  label: string
  unit: string
  description: string
  icon?: string
}

export const ALERT_METRIC_INFO: Record<string, AlertMetricConfig> = {
  api_calls: {
    label: 'API Calls',
    unit: 'calls',
    description: 'Total API requests made',
  },
  tokens: {
    label: 'Tokens',
    unit: 'tokens',
    description: 'LLM tokens consumed',
  },
  storage: {
    label: 'Storage',
    unit: 'MB',
    description: 'Data storage used',
  },
  bandwidth: {
    label: 'Bandwidth',
    unit: 'GB',
    description: 'Data transfer',
  },
}
