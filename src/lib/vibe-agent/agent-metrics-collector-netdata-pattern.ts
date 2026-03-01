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
 *
 * Key differences from agent-health-monitor.ts:
 * - health-monitor: Aggregate counters (total success/error)
 * - metrics-collector: Time-series data points with timestamps for charts
 */

// ─── Metric Types ───────────────────────────────────────────

/** A single data point (Netdata: one row in the database) */
export interface MetricDataPoint {
  timestamp: number; // Unix ms
  value: number;
  dimensions?: Record<string, number>; // Netdata dimensions
}

/** Chart configuration (Netdata: chart definition in collector) */
export interface MetricChartConfig {
  id: string;
  name: string;
  /** Unit for display (ms, %, count, bytes) */
  units: string;
  /** Chart type (Netdata: line, area, stacked) */
  type: 'line' | 'area' | 'stacked';
  /** Max data points to retain (ring buffer size, default: 300 = 5 min @ 1s) */
  historySize: number;
  /** Dimension names (sub-metrics within chart) */
  dimensions: string[];
}

/** Alarm definition (Netdata: health.d/*.conf pattern) */
export interface MetricAlarmDefinition {
  id: string;
  chartId: string;
  /** Which dimension to check (or 'value' for main) */
  dimension: string;
  /** Operator for threshold check */
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  /** Threshold value */
  threshold: number;
  /** How many consecutive breaches before firing (Netdata: lookup) */
  lookback: number;
  /** Severity level */
  severity: 'warning' | 'critical';
  /** Human-readable description */
  description: string;
}

/** Alarm state (Netdata: alarm status) */
export interface MetricAlarmState {
  alarm: MetricAlarmDefinition;
  status: 'clear' | 'warning' | 'critical';
  consecutiveBreaches: number;
  lastCheckedAt: number;
  lastTriggeredAt: number | null;
  currentValue: number | null;
}

/** Time-range query params (Netdata: /api/v1/data) */
export interface MetricQuery {
  chartId: string;
  /** Start time (Unix ms, default: historySize ago) */
  after?: number;
  /** End time (Unix ms, default: now) */
  before?: number;
  /** Aggregation points (downsample to N points) */
  points?: number;
  /** Dimensions to include (default: all) */
  dimensions?: string[];
}

/** Query result (Netdata: /api/v1/data response format) */
export interface MetricQueryResult {
  chartId: string;
  chartName: string;
  units: string;
  dimensions: string[];
  data: MetricDataPoint[];
  pointCount: number;
  timeRange: { after: number; before: number };
}

// ─── Chart Storage (Ring Buffer) ────────────────────────────

class MetricChart {
  readonly config: MetricChartConfig;
  private buffer: MetricDataPoint[] = [];

  constructor(config: MetricChartConfig) {
    this.config = config;
  }

  /** Record a data point (Netdata: chart.update()) */
  record(value: number, dimensions?: Record<string, number>): void {
    const point: MetricDataPoint = {
      timestamp: Date.now(),
      value,
      dimensions,
    };

    this.buffer.push(point);

    // Ring buffer — trim to history size
    if (this.buffer.length > this.config.historySize) {
      this.buffer = this.buffer.slice(-this.config.historySize);
    }
  }

  /** Query data by time range (Netdata: /api/v1/data) */
  query(after?: number, before?: number): MetricDataPoint[] {
    const now = Date.now();
    const start = after ?? (now - this.config.historySize * 1000);
    const end = before ?? now;

    return this.buffer.filter(
      (p) => p.timestamp >= start && p.timestamp <= end,
    );
  }

  /** Get latest data point */
  latest(): MetricDataPoint | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  /** Get total data points stored */
  size(): number {
    return this.buffer.length;
  }

  /** Clear all data (for testing) */
  clear(): void {
    this.buffer = [];
  }
}

// ─── Metrics Collector (Netdata Collector Plugin Pattern) ───

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

  // ─── Chart Management ──────────────────────────────────

  /** Define a new metric chart (Netdata: chart definition in collector plugin) */
  defineChart(config: MetricChartConfig): void {
    if (!this.charts.has(config.id)) {
      this.charts.set(config.id, new MetricChart(config));
    }
  }

  /** Record a metric value to a chart */
  record(chartId: string, value: number, dimensions?: Record<string, number>): void {
    const chart = this.charts.get(chartId);
    if (!chart) return;

    chart.record(value, dimensions);

    // Check alarms after recording
    this.evaluateAlarmsForChart(chartId);
  }

  /** Query chart data by time range (Netdata: /api/v1/data) */
  query(params: MetricQuery): MetricQueryResult | null {
    const chart = this.charts.get(params.chartId);
    if (!chart) return null;

    let data = chart.query(params.after, params.before);

    // Filter dimensions if specified
    if (params.dimensions && params.dimensions.length > 0) {
      const dims = new Set(params.dimensions);
      data = data.map((p) => ({
        ...p,
        dimensions: p.dimensions
          ? Object.fromEntries(
              Object.entries(p.dimensions).filter(([k]) => dims.has(k)),
            )
          : undefined,
      }));
    }

    // Downsample if points specified (Netdata: group=average)
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

  /** Get latest value for a chart */
  latest(chartId: string): MetricDataPoint | null {
    return this.charts.get(chartId)?.latest() ?? null;
  }

  /** List all defined charts (Netdata: /api/v1/charts) */
  listCharts(): Array<{ id: string; name: string; units: string; dataPoints: number }> {
    return Array.from(this.charts.entries()).map(([id, chart]) => ({
      id,
      name: chart.config.name,
      units: chart.config.units,
      dataPoints: chart.size(),
    }));
  }

  // ─── Alarm Management (Netdata health.d/ pattern) ──────

  /** Define a declarative alarm (Netdata: alarm definition in .conf) */
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

  /** Set callback for alarm state changes */
  setAlarmHandler(handler: (alarm: MetricAlarmState) => void): void {
    this.onAlarmFired = handler;
  }

  /** Get all alarm states (Netdata: /api/v1/alarms) */
  getAlarmStates(): MetricAlarmState[] {
    return Array.from(this.alarms.values());
  }

  /** Get active (non-clear) alarms */
  getActiveAlarms(): MetricAlarmState[] {
    return this.getAlarmStates().filter((a) => a.status !== 'clear');
  }

  // ─── Dashboard Summary (Netdata: /api/v1/info) ────────

  /** Get full dashboard summary */
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

  /** Clear all charts and alarms (for testing) */
  clear(): void {
    this.charts.forEach((c) => c.clear());
    this.charts.clear();
    this.alarms.clear();
    this.onAlarmFired = null;
  }

  // ─── Internal ──────────────────────────────────────────

  /** Evaluate alarms for a specific chart after new data */
  private evaluateAlarmsForChart(chartId: string): void {
    for (const state of this.alarms.values()) {
      if (state.alarm.chartId !== chartId) continue;

      const chart = this.charts.get(chartId);
      if (!chart) continue;

      const latest = chart.latest();
      if (!latest) continue;

      // Get the value to check (main value or specific dimension)
      const checkValue = state.alarm.dimension === 'value'
        ? latest.value
        : latest.dimensions?.[state.alarm.dimension] ?? latest.value;

      state.currentValue = checkValue;
      state.lastCheckedAt = Date.now();

      const breached = evaluateThreshold(
        checkValue,
        state.alarm.operator,
        state.alarm.threshold,
      );

      if (breached) {
        state.consecutiveBreaches++;
        if (state.consecutiveBreaches >= state.alarm.lookback) {
          const previousStatus = state.status;
          state.status = state.alarm.severity;
          state.lastTriggeredAt = Date.now();

          // Fire callback on status change (clear → warning/critical)
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

// ─── Utility Functions ──────────────────────────────────────

function evaluateThreshold(
  value: number,
  operator: MetricAlarmDefinition['operator'],
  threshold: number,
): boolean {
  switch (operator) {
    case 'gt': return value > threshold;
    case 'lt': return value < threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
    case 'eq': return value === threshold;
  }
}

/** Downsample data points by averaging groups (Netdata: group=average) */
function downsample(data: MetricDataPoint[], targetPoints: number): MetricDataPoint[] {
  if (data.length <= targetPoints) return data;

  const groupSize = Math.ceil(data.length / targetPoints);
  const result: MetricDataPoint[] = [];

  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    const avgValue = group.reduce((s, p) => s + p.value, 0) / group.length;
    const midTimestamp = group[Math.floor(group.length / 2)].timestamp;

    // Average dimensions if present
    let avgDimensions: Record<string, number> | undefined;
    if (group[0].dimensions) {
      avgDimensions = {};
      const keys = Object.keys(group[0].dimensions);
      for (const key of keys) {
        const sum = group.reduce((s, p) => s + (p.dimensions?.[key] ?? 0), 0);
        avgDimensions[key] = sum / group.length;
      }
    }

    result.push({
      timestamp: midTimestamp,
      value: Math.round(avgValue * 100) / 100,
      dimensions: avgDimensions,
    });
  }

  return result;
}

// ─── Singleton Export ───────────────────────────────────────

/** Global agent metrics collector — Netdata-inspired monitoring */
export const agentMetricsCollector = new AgentMetricsCollector();

// ─── Pre-configured Charts (like Netdata system.cpu, system.ram) ─

/** Initialize default agent monitoring charts */
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

  // Default alarms (Netdata health.d/ pattern)
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
