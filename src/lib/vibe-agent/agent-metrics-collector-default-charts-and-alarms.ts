/**
 * Agent Metrics Collector — Default charts and alarm definitions (Netdata pattern).
 *
 * Pre-configured charts and alarms for standard agent observability:
 * latency, throughput, error-rate — with high-latency and high-error-rate alarms.
 *
 * Extracted from agent-metrics-collector-netdata-pattern.ts.
 */

import { agentMetricsCollector } from './agent-metrics-collector-netdata-pattern';

/**
 * Register default agent charts and alarms on the global metrics collector.
 * Call once at app startup.
 */
export function initDefaultAgentCharts(): void {
  agentMetricsCollector.defineChart({
    id: 'agent.latency',
    name: 'Agent Response Latency',
    units: 'ms',
    type: 'line',
    historySize: 300,
    dimensions: ['p50', 'p95', 'p99', 'avg'],
  });

  agentMetricsCollector.defineChart({
    id: 'agent.throughput',
    name: 'Agent Request Throughput',
    units: 'req/s',
    type: 'area',
    historySize: 300,
    dimensions: ['success', 'error'],
  });

  agentMetricsCollector.defineChart({
    id: 'agent.error-rate',
    name: 'Agent Error Rate',
    units: '%',
    type: 'line',
    historySize: 300,
    dimensions: ['rate'],
  });

  agentMetricsCollector.defineAlarm({
    id: 'high-latency',
    chartId: 'agent.latency',
    dimension: 'avg',
    operator: 'gt',
    threshold: 5000,
    lookback: 3,
    severity: 'warning',
    description: 'Agent average latency exceeds 5s for 3 consecutive checks',
  });

  agentMetricsCollector.defineAlarm({
    id: 'high-error-rate',
    chartId: 'agent.error-rate',
    dimension: 'rate',
    operator: 'gt',
    threshold: 50,
    lookback: 5,
    severity: 'critical',
    description: 'Agent error rate exceeds 50% for 5 consecutive checks',
  });
}
