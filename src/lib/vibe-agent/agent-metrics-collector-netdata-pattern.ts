/**
 * Agent Metrics Collector — Netdata real-time monitoring pattern.
 *
 * Maps Netdata's architecture to agent observability:
 * - Chart: Time-series ring buffer per metric (netdata chart_type)
 * - Dimension: Sub-metrics within a chart (latency, throughput, errors)
 * - Collector: Plugin that samples metrics at intervals (netdata plugin.d/)
 * - Alarm: Declarative threshold check (netdata health.d/ .conf pattern)
 * - Dashboard API: Query by time range, aggregate, slice
 *
 * Pattern source: netdata/netdata src/collectors/ + src/health/
 */

export type {
  MetricDataPoint,
  MetricChartConfig,
  MetricAlarmDefinition,
  MetricAlarmState,
  MetricQuery,
  MetricQueryResult,
} from './agent-metrics-collector-types';

import type {
  MetricChartConfig,
  MetricAlarmDefinition,
  MetricAlarmState,
  MetricQuery,
  MetricQueryResult,
  MetricDataPoint,
} from './agent-metrics-collector-types';

import {
  MetricChart,
  evaluateThreshold,
  downsample,
} from './agent-metrics-collector-ring-buffer-and-helpers';

// ─── Metrics Collector (Netdata Collector Plugin Pattern) ────

/**
 * Agent Metrics Collector — Netdata-inspired monitoring singleton.
 *
 * Usage:
 *   collector.defineChart({ id: 'agent.latency', ... });
 *   collector.record('agent.latency', 42, { p50: 30, p99: 120 });
 *   collector.defineAlarm({ chartId: 'agent.latency', threshold: 100, ... });
 *   const data = collector.query({ chartId: 'agent.latency', after: Date.now() - 60000 });
 */
class AgentMetricsCollector {
  private charts: Map<string, MetricChart> = new Map();
  private alarms: Map<string, MetricAlarmState> = new Map();
  private onAlarmFired: ((alarm: MetricAlarmState) => void) | null = null;

  // ─── Chart Management ───────────────────────────────────

  defineChart(config: MetricChartConfig): void {
    if (!this.charts.has(config.id)) {
      this.charts.set(config.id, new MetricChart(config));
    }
  }

  record(chartId: string, value: number, dimensions?: Record<string, number>): void {
    const chart = this.charts.get(chartId);
    if (!chart) return;
    chart.record(value, dimensions);
    this.evaluateAlarmsForChart(chartId);
  }

  query(params: MetricQuery): MetricQueryResult | null {
    const chart = this.charts.get(params.chartId);
    if (!chart) return null;

    let data = chart.query(params.after, params.before);

    if (params.dimensions && params.dimensions.length > 0) {
      const dims = new Set(params.dimensions);
      data = data.map((p) => ({
        ...p,
        dimensions: p.dimensions
          ? Object.fromEntries(Object.entries(p.dimensions).filter(([k]) => dims.has(k)))
          : undefined,
      }));
    }

    if (params.points && params.points > 0 && data.length > params.points) {
      data = downsample(data, params.points);
    }

    return {
      chartId: params.chartId,
      chartName: chart.config.name,
      units: chart.config.units,
      dimensions: params.dimensions ?? chart.config.dimensions,
      data,
      pointCount: data.length,
      timeRange: {
        after: data.length > 0 ? data[0].timestamp : 0,
        before: data.length > 0 ? data[data.length - 1].timestamp : 0,
      },
    };
  }

  latest(chartId: string): MetricDataPoint | null {
    return this.charts.get(chartId)?.latest() ?? null;
  }

  listCharts(): Array<{ id: string; name: string; units: string; dataPoints: number }> {
    return Array.from(this.charts.entries()).map(([id, chart]) => ({
      id,
      name: chart.config.name,
      units: chart.config.units,
      dataPoints: chart.size(),
    }));
  }

  // ─── Alarm Management (Netdata health.d/ pattern) ───────

  defineAlarm(alarm: MetricAlarmDefinition): void {
    this.alarms.set(alarm.id, {
      alarm,
      status: 'clear',
      consecutiveBreaches: 0,
      lastCheckedAt: 0,
      lastTriggeredAt: null,
      currentValue: null,
    });
  }

  setAlarmHandler(handler: (alarm: MetricAlarmState) => void): void {
    this.onAlarmFired = handler;
  }

  getAlarmStates(): MetricAlarmState[] {
    return Array.from(this.alarms.values());
  }

  getActiveAlarms(): MetricAlarmState[] {
    return this.getAlarmStates().filter((a) => a.status !== 'clear');
  }

  getDashboardSummary(): {
    chartCount: number;
    totalDataPoints: number;
    alarmCount: number;
    activeAlarms: number;
    charts: Array<{ id: string; name: string; units: string; dataPoints: number }>;
  } {
    const charts = this.listCharts();
    return {
      chartCount: charts.length,
      totalDataPoints: charts.reduce((sum, c) => sum + c.dataPoints, 0),
      alarmCount: this.alarms.size,
      activeAlarms: this.getActiveAlarms().length,
      charts,
    };
  }

  clear(): void {
    this.charts.forEach((c) => c.clear());
    this.charts.clear();
    this.alarms.clear();
    this.onAlarmFired = null;
  }

  // ─── Internal ───────────────────────────────────────────

  private evaluateAlarmsForChart(chartId: string): void {
    for (const state of this.alarms.values()) {
      if (state.alarm.chartId !== chartId) continue;
      const chart = this.charts.get(chartId);
      if (!chart) continue;
      const latest = chart.latest();
      if (!latest) continue;

      const checkValue = state.alarm.dimension === 'value'
        ? latest.value
        : latest.dimensions?.[state.alarm.dimension] ?? latest.value;

      state.currentValue = checkValue;
      state.lastCheckedAt = Date.now();

      const breached = evaluateThreshold(checkValue, state.alarm.operator, state.alarm.threshold);

      if (breached) {
        state.consecutiveBreaches++;
        if (state.consecutiveBreaches >= state.alarm.lookback) {
          const previousStatus = state.status;
          state.status = state.alarm.severity;
          state.lastTriggeredAt = Date.now();
          if (previousStatus === 'clear' && this.onAlarmFired) {
            this.onAlarmFired(state);
          }
        }
      } else {
        state.consecutiveBreaches = 0;
        state.status = 'clear';
      }
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const agentMetricsCollector = new AgentMetricsCollector();

// ─── Pre-configured Charts ───────────────────────────────────

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
